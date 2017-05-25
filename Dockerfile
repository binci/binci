FROM mhart/alpine-node:6

RUN apk update && apk add docker && npm i yarn -g

CMD ["/bin/sh"]
