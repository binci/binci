/*
 * PROPRIETARY AND CONFIDENTIAL
 *
 * The contents of this example are proprietary and confidential, and may not be used or distributed without express
 * written permission from MongoLab.
 *
 */

var mongodb = require("mongodb");
var async = require("async");

var ObjectId = mongodb.ObjectID;

//mongodb.Logger.setLevel("debug");
var uri = process.env.MONGODB_URI;

function log(s) {
    console.log(new Date().toISOString() + " " + s);
}

log("Connecting...");
mongodb.MongoClient.connect(
    uri,
    {
        replSet: {
            //poolSize: 10
            socketOptions: {
                connectTimeoutMS: 60 * 1000
            }
        }
    },
    function (err, db) {
        if (err) {
            log("Error trying to connect.");
            log(err.stack);
        } else {
            log("Connected.");
            db.serverConfig.on('joined', function(t, s) {
                log("joined :: " + t + " :: " + s.name);
            });
            db.serverConfig.on('left', function(t, s) {
                log("joined :: " + t + " :: " + s.name);
            });
            db.serverConfig.on('timeout', function(err) {
                log("timeout :: ");
                log(err.stack);
            });
            log("Running aggregations...");
            async.forEachOf(
                aggregations,
                function (item, i, cb) {
                    log("Running aggregation " + i + "...");
                    db.collection(item.collection).aggregate(item.pipeline, function (err, result) {
                        if (err) {
                            log("Error running aggregation " + i + ".");
                            log(err.stack)
                        } else {
                            log("Done running aggregation " + i + ".");
                        }
                        cb();
                    });
                },
                function (err) {
                    if (err) {
                        log("Untrapped error.");
                        log(err.stack);
                    } else {
                        log("Finished running all aggregations.")
                    }
                    log("Closing database...");
                    db.close();
                }
            )
        }
    }
);

var aggregations = [
    // ========== 1 ==========
    {
        collection: "tlogs",
        pipeline: [
            {
                "$match": {
                    "_type": "tlog",
                    "organization": ObjectId("53eb1ee2e6c77111203d8503"),
                    "businessDate": {
                        "$gte": ISODate("2015-11-01T00:00:00.000+0000"),
                        "$lt": ISODate("2015-11-28T23:59:59.999+0000")
                    }
                }
            },
            {
                "$unwind": "$order"
            },
            {
                "$unwind": "$order.orderedOffers"
            },
            {
                "$redact": {
                    "$cond": {
                        "if": {
                            "$not": "$order.orderedOffers.onTheHouse"
                        },
                        "then": "$$KEEP",
                        "else": "$$PRUNE"
                    }
                }
            },
            {
                "$redact": {
                    "$cond": {
                        "if": {
                            "$not": "$order.orderedOffers.cancellation"
                        },
                        "then": "$$KEEP",
                        "else": "$$PRUNE"
                    }
                }
            },
            {
                "$group": {
                    "_id": "$order.orderedOffers.offer",
                    "offer": {
                        "$first": "$order.orderedOffers.offer"
                    },
                    "menu": {
                        "$first": "$order.orderedOffers.menu"
                    },
                    "totalAmount": {
                        "$sum": "$order.orderedOffers.amount"
                    },
                    "totalCount": {
                        "$sum": NumberInt(1)
                    },
                    "totalDiners": {
                        "$sum": "$diners"
                    }
                }
            }
        ]
    },
    // ========== 2 ==========
    {
        collection: "tlogs",
        pipeline: [
            {
                "$match": {
                    "_type": "tlog",
                    "organization": ObjectId("53eb1ee2e6c77111203d8503"),
                    "businessDate": {
                        "$gte": ISODate("2015-11-01T00:00:00.000+0000"),
                        "$lt": ISODate("2015-11-28T23:59:59.999+0000")
                    }
                }
            },
            {
                "$unwind": "$order"
            },
            {
                "$unwind": "$order.orderedItems"
            },
            {
                "$redact": {
                    "$cond": {
                        "if": {
                            "$not": "$order.orderedItems.onTheHouse"
                        },
                        "then": "$$PRUNE",
                        "else": "$$KEEP"
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "category": "$order.orderedItems.category"
                    },
                    "totalItems": {
                        "$sum": NumberInt(1)
                    },
                    "totalAmount": {
                        "$sum": "$order.orderedItems.price"
                    }
                }
            }
        ]
    },
    // ========== 3 ==========
    {
        collection: "tlogs",
        pipeline: [
            {
                "$match": {
                    "_type": "tlog",
                    "organization": ObjectId("53eb1ee2e6c77111203d8503"),
                    "businessDate": {
                        "$gte": ISODate("2015-11-01T00:00:00.000+0000"),
                        "$lt": ISODate("2015-11-28T23:59:59.999+0000")
                    },
                    "order": {
                        "$elemMatch": {
                            "onTheHouse": null
                        }
                    }
                }
            },
            {
                "$unwind": "$order"
            },
            {
                "$unwind": "$order.tips"
            },
            {
                "$project": {
                    "_id": "$order.tips._id",
                    "tableTip": {
                        "$cond": [
                            {
                                "$eq": [
                                    {
                                        "$size": {
                                            "$setIntersection": [
                                                "$order.tableIds",
                                                [
                                                    ObjectId("53eb1ee4e6c77111203d852e"),
                                                    ObjectId("53eb1ee4e6c77111203d852f"),
                                                    ObjectId("53eb1ee4e6c77111203d8530"),
                                                    ObjectId("53eb1ee4e6c77111203d8531"),
                                                    ObjectId("53eb1ee4e6c77111203d8532"),
                                                    ObjectId("53eb1ee4e6c77111203d8533"),
                                                    ObjectId("53eb1ee4e6c77111203d8534"),
                                                    ObjectId("53eb1ee4e6c77111203d8535"),
                                                    ObjectId("53eb1ee4e6c77111203d8536"),
                                                    ObjectId("53eb1ee4e6c77111203d8537"),
                                                    ObjectId("53eb1ee4e6c77111203d8538"),
                                                    ObjectId("53eb1ee4e6c77111203d8539"),
                                                    ObjectId("53eb1ee4e6c77111203d853a"),
                                                    ObjectId("53eb1ee4e6c77111203d853b"),
                                                    ObjectId("53eb1ee4e6c77111203d853c"),
                                                    ObjectId("53eb1ee4e6c77111203d853d"),
                                                    ObjectId("53eb1ee4e6c77111203d853e"),
                                                    ObjectId("53eb1ee4e6c77111203d853f"),
                                                    ObjectId("53eb1ee4e6c77111203d8540"),
                                                    ObjectId("53eb1ee4e6c77111203d8541"),
                                                    ObjectId("53eb1ee4e6c77111203d8542"),
                                                    ObjectId("53eb1ee4e6c77111203d8543"),
                                                    ObjectId("53eb1ee4e6c77111203d8544"),
                                                    ObjectId("53eb1ee4e6c77111203d8545"),
                                                    ObjectId("53eb1ee4e6c77111203d8546"),
                                                    ObjectId("53eb1ee4e6c77111203d8547"),
                                                    ObjectId("53eb1ee4e6c77111203d8548"),
                                                    ObjectId("53eb1ee4e6c77111203d8549"),
                                                    ObjectId("53eb1ee4e6c77111203d854a"),
                                                    ObjectId("53eb1ee4e6c77111203d854b"),
                                                    ObjectId("53eb1ee4e6c77111203d854c"),
                                                    ObjectId("53eb1ee4e6c77111203d854d"),
                                                    ObjectId("53eb1ee4e6c77111203d854e"),
                                                    ObjectId("53eb1ee4e6c77111203d854f"),
                                                    ObjectId("53eb1ee4e6c77111203d8550"),
                                                    ObjectId("53eb1ee4e6c77111203d8551"),
                                                    ObjectId("53eb1ee4e6c77111203d8552"),
                                                    ObjectId("53eb1ee4e6c77111203d8553"),
                                                    ObjectId("53eb1ee4e6c77111203d8554"),
                                                    ObjectId("53eb1ee4e6c77111203d8555")
                                                ]
                                            ]
                                        }
                                    },
                                    NumberInt(0)
                                ]
                            },
                            false,
                            true
                        ]
                    },
                    "amount": "$order.tips.amount"
                }
            },
            {
                "$group": {
                    "_id": "$tableTip",
                    "tableTip": {
                        "$first": "$tableTip"
                    },
                    "totalAmount": {
                        "$sum": "$amount"
                    },
                    "totalCount": {
                        "$sum": NumberInt(1)
                    }
                }
            }
        ]
    },
    // ========== 4 ==========
    {
        collection: "tlogs",
        pipeline: [
            {
                "$match": {
                    "_type": "tlog",
                    "organization": ObjectId("53eb1ee2e6c77111203d8503"),
                    "businessDate": {
                        "$gte": ISODate("2015-11-01T00:00:00.000+0000"),
                        "$lt": ISODate("2015-11-28T23:59:59.999+0000")
                    }
                }
            },
            {
                "$unwind": "$order"
            },
            {
                "$group": {
                    "_id": {
                        "orderType": "$order.orderType"
                    },
                    "orderType": {
                        "$first": "$order.orderType"
                    },
                    "diners": {
                        "$sum": "$diners"
                    },
                    "totalCount": {
                        "$sum": NumberInt(1)
                    }
                }
            }
        ]
    },
    // 5, 6, and 7 deleted by Akira just to reduce character count within this JIRA comment.
    // ========== 8 ==========
    {
        collection: "tlogs",
        pipeline: [
            {
                "$match": {
                    "_type": "tlog",
                    "organization": ObjectId("53eb1ee2e6c77111203d8503"),
                    "businessDate": {
                        "$gte": ISODate("2015-10-01T00:00:00.000+0000"),
                        "$lt": ISODate("2015-11-28T23:59:59.999+0000")
                    }
                }
            },
            {
                "$unwind": "$order"
            },
            {
                "$unwind": "$order.orderedItems"
            },
            {
                "$redact": {
                    "$cond": {
                        "if": {
                            "$and": [
                                {
                                    "$not": "$order.orderedItems.cancellation"
                                },
                                {
                                    "$not": "$order.orderedItems.onTheHouse"
                                }
                            ]
                        },
                        "then": "$$KEEP",
                        "else": "$$KEEP"
                    }
                }
            },
            {
                "$unwind": "$order.orderedItems.selectedModifiers"
            },
            {
                "$group": {
                    "_id": {
                        "category": "$order.orderedItems.category"
                    },
                    "totalAmount": {
                        "$sum": "$order.orderedItems.selectedModifiers.price"
                    }
                }
            }
        ]
    },
    // ========== 9 ==========
    {
        collection: "tlogs",
        pipeline: [
            {
                "$match": {
                    "_type": "tlog",
                    "organization": ObjectId("53eb1ee2e6c77111203d8503"),
                    "businessDate": {
                        "$gte": ISODate("2015-10-01T00:00:00.000+0000"),
                        "$lt": ISODate("2015-11-28T23:59:59.999+0000")
                    },
                    "order.orderType": "Refund"
                }
            },
            {
                "$unwind": "$order"
            },
            {
                "$unwind": "$order.payments"
            },
            {
                "$group": {
                    "_id": null,
                    "totalCount": {
                        "$sum": NumberInt(1)
                    },
                    "totalAmount": {
                        "$sum": "$order.payments.amount"
                    }
                }
            }
        ]
    }
];

function ISODate(x) {
    return new Date(x);
}

function NumberInt(x) {
    return x;
}
