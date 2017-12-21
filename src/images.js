'use strict'

const proc = require('./proc')
const output = require('./output')
const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const images = {
  /**
   * Builds a docker image, naming it according to the parent folder and tagging it
   * with "bc_" followed by a hash of the Dockerfile used to build it.
   * @param {string} dockerfile The path (absolute or relative from the current working dir) to
   * the Dockerfile to be built
   * @param {Array<string>} [tags=[]] An array of tags with which to tag the new image
   * @returns {Promise.<string>} A tag that can be used to launch a container of this new image
   */
  buildImage: (dockerfile, tags = []) => {
    output.info(`Building image from ${dockerfile}`)
    output.line()
    const tagArgs = tags.reduce((acc, cur) => acc.concat(['-t', cur]), [])
    return proc.run([
      'build',
      '-f', path.resolve(process.cwd(), dockerfile)
    ].concat(tagArgs).concat([process.cwd()])
    ).then(() => {
      output.line()
      output.success('Image built successfully!')
      return tags[tags.length - 1]
    }).catch(e => {
      output.line()
      output.error('Build failed')
      throw e
    })
  },
  /**
   * Deletes a docker image
   * @param {Promise} imageName The name of the image to be deleted in the format name:tag
   */
  deleteImage: (imageName) => Promise.resolve().then(() => {
    const delSpinner = output.spinner(`Deleting old image: ${imageName}`)
    const cmd = `docker rmi ${imageName}`
    try {
      cp.execSync(cmd)
    } catch (e) {
      delSpinner.fail()
      throw e
    }
    delSpinner.succeed()
  }),
  /**
   * Searches for images that have been been automatically built by binci for the
   * current project, and returns them as an array of objects containing the fields
   * "hash" (the truncated sha1 of the Dockerfile that built the image), and "createdAt"
   * (the Epoch time of image creation).
   * @returns {Promise.<Array<{id:string},{hash:string},{createdAt:number}>>} the
   * array of images pertaining to this project
   */
  getBuiltImages: () => Promise.resolve().then(() => {
    const cmd = [
      'docker images',
      '--format',
      `'{{"{"}}"tag":"{{.Tag}}","createdAt":"{{.CreatedAt}}"{{"}"}}'`,
      '"--filter=reference=' + images.getProjectName() + ':bc_*"'
    ].join(' ')
    const out = cp.execSync(cmd).toString()
    const parsed = JSON.parse('[' + out.replace(/\s*$/g, '').split('\n').join(',') + ']')
    return parsed.map(elem => ({
      hash: elem.tag.substr(3),
      createdAt: new Date(elem.createdAt).getTime()
    }))
  }),
  /**
   * Gets the SHA-1 checksum, truncated to 12 hexadecimal digits, of the contents of the file at path.
   * @param {string} path The path of the file for the checksum
   * @returns {Promise.<string|null>} The sha1 as a hex string, or null if the file does not exist.
   */
  getHash: (path) => new Promise((resolve, reject) => {
    const shasum = crypto.createHash('sha1')
    const stream = fs.createReadStream(path)
    stream.on('error', err => {
      if (err.code && err.code === 'ENOENT') resolve(null)
      else reject(err)
    })
    stream.on('data', data => shasum.update(data))
    stream.on('close', () => resolve(shasum.digest('hex').substr(0, 12)))
  }),
  /**
   * Gets a valid image name:tag that can be used to run a new docker container.
   * If an image has already been built for this dockerfile, the existing image will
   * be returned. If no build has happened yet or the dockerfile has been changed
   * since the last build, a new build will be run, and the previous image will be
   * deleted (if one exists).
   * @param {String} [dockerfile="./Dockerfile"] The path to the dockerfile to be
   * used for building the new image or retrieving the existing one
   * @param {Array<string>} [tags=[]] An optional array of tags with which to tag a new
   * image, if one needs to be built
   * @returns {Promise.<string>} the name:tag of the image to be used
   */
  getImage: (dockerfile = './Dockerfile', tags = []) => {
    return Promise.all([
      images.getHash(dockerfile),
      images.getBuiltImages()
    ]).then(([ hash, imgs ]) => {
      if (!hash) {
        throw new Error(`No "from" specified, and ${dockerfile} does not exist.`)
      }
      const [ image ] = imgs.filter(img => img.hash === hash)
      if (image) return images.getImageNameFromHash(hash)
      // Find the most recent binci build so we can delete it after the new one builds
      const mostRecent = imgs.reduce((acc, elem) => {
        if (acc.createdAt > elem.createdAt) return acc
        return elem
      }, {hash: null, createdAt: 0})
      tags.push(images.getImageNameFromHash(hash))
      return images.buildImage(dockerfile, tags)
        .then(imageName => {
          if (mostRecent.hash) {
            return images.deleteImage(images.getImageNameFromHash(mostRecent.hash))
              .then(() => imageName)
          }
          return imageName
        })
    })
  },
  /**
   * Constructs a full name:tag string for a given Dockerfile hash for this project
   * @param {string} hash The Dockerfile hash of the build
   * @returns {string} The fully qualified image name
   */
  getImageNameFromHash: (hash) => `${images.getProjectName()}:bc_${hash}`,
  /**
   * Gets the name of the project binci is running for. This is simply the name of
   * the directory in which binci has been executed.
   * @returns {string} the project name
   */
  getProjectName: () => path.basename(process.cwd())
}

module.exports = images
