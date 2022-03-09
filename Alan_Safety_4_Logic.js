// {Name: Alan_Safety_4_Logic}
// {Description: Alan Safety iOS application voice interface}
// {Visibility: Admin}

recognitionHints(`ladder`);

const utils = project.utils;

const AUTH = {
//    "tellusAuthenticationToken": "f60d605f-b45a-4fe0-aca1-7efd4c1f5dd4",
    "tellusAuthenticationToken": "demo",
    "tellusBaseUrl": "https://fusionplatform_dev.fatpot.com:15796",
    "tellusDeviceId": "E72AA083-B63C-4BA3-B8BE-6CEB02F8D6C2",
    "tellusUsername": "alan",
};

const DISPATCH_INTENTS = _(Object.keys(project.dispatchCenters).map(x => [x, ...project.dispatchCenters[x]])).flatten().join('|');
const DC = {}; _(Object.keys(project.dispatchCenters)).forEach(x => { DC[x] = x; project.dispatchCenters[x].forEach(a => DC[a] = x)});

const NATURE_INTENTS = _(Object.keys(project.NATURE_CODES))
    .filter(k => !_.isEmpty(project.NATURE_CODES[k]))
    .map(k => project.NATURE_CODES[k]
                 .filter(v => !project.NATURE_CODES_NOT_FUZZY ||
                             !project.NATURE_CODES_NOT_FUZZY.includes(v))
                 .map(v => v + '~' + k))
    .flatten()
    .join('|');

const NATURE_NOT_FUZZY = project.NATURE_CODES_NOT_FUZZY ?
      _(Object.keys(project.NATURE_CODES))
        .map(code => ({code: code,
                       natures: project.NATURE_CODES[code]
                               .filter(v => project.NATURE_CODES_NOT_FUZZY.includes(v))}))
        .filter(o => o.natures.length)
        .map(o => o.natures.map(v => [v.toLowerCase(), o.code]))
        .flatten()
        .fromPairs()
        .value() :
      {};

const NATURE_NOT_FUZZY_INTENTS = project.NATURE_CODES_NOT_FUZZY ?
      project.NATURE_CODES_NOT_FUZZY
        .filter(e => NATURE_NOT_FUZZY[e])
        .join('|') :
      '';

const SINGLE_CODES = Object.keys(project.NATURE_CODES)
    .filter(k => _.isEmpty(project.NATURE_CODES[k]))
    .join('|');
const DIGIT_CODES_PATTERN = '(9|10|11|nine|ten|eleven)\\s+(\\d{2,3}|((and|[0-9]|zero|oh|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(\\s|$))+)';


const Unit = "Unit";
const Call = "Call";
const All = "All";
const DETAILS = "details";

const STATUSES_ALIASES = utils.aliases(
    [
        "Unknown",
        "Pending",
        "Dispatched",
        "Cleared",
        "Transporting",
        ["Enroute", "route"],
        ["AtScene", "at scene", "scene"]
    ],
    (k) => k.toLowerCase()
);
const STATUS_INTENTS = Object.keys(STATUSES_ALIASES).join('|');
const UNIT_STATUSES = _.chain(Object.values(STATUSES_ALIASES)).uniq().map(s => Unit + s).value();
const CALL_STATUSES = _.chain(Object.values(STATUSES_ALIASES)).uniq().map(s => Call + s).value();

const TYPE_ALIASES = utils.aliases(
    [
        "FIRE",
        "OTHER",
        ["LAW", "police"],
        ["EMS", "emergency", "medical", "e m s", "emergency medical service"]
    ],
    k => k.toLowerCase()
);
const TYPE_INTENTS = Object.keys(TYPE_ALIASES).join('|');
const TYPES = _.uniq(Object.values(TYPE_ALIASES));

const CALL_ATTR_ALIASES = utils.aliases([
    "comments",
    "type",
    "address",
    "nature",
    "assigned",
    ["status", "statuses"],
    ["priority description", "priority descriptions"],
    ["priority", "priority code", "priority codes", "priorities"],
    ["location", "locations"],
    ["dispatch center", "dispatch centers", "dispatch"],
    ["agency", "agencies"],
    ["details", "assigned"],
    ["number", "incident number", "incident numbers", "call number", "call numbers"],
    ["time", "incident time", "incident times", "call time", "call times"]
]);
const CALL_ATTR_INTENTS = Object.keys(CALL_ATTR_ALIASES).join("|");

const UNIT_ATTR_ALIASES = utils.aliases([
    "status",
    "agency",
    "details",
    "location",
    "dispatch",
    ["callLocation", "incident location", "call location"],
    ["dispatch", "dispatch center"],
    ["callDetails", "incident details", "call details"],
    ["callInfo", "call", "incident"]
]);
const UNIT_ATTR_INTENTS = Object.keys(UNIT_ATTR_ALIASES).join('|');

const SORT_ATTR_CALLS = utils.aliases([
    ["name", "number", "incident number"],
    ["dispatch", "dispatch center"],
    ["time", "status time"],
    "address",
    "agency",
    "priority",
    "status"
]);
const SORT_ATTR_UNITS = utils.aliases([
    ["name", "number", "unit number"],
    ["dispatch", "dispatch center"],
    ["time", "status time"],
    "agency",
    "station",
    "status"
]);
const ORDER_ATTR = utils.aliases([
    ["asc", "ascending", "a to z", "0 to 9", "1 to 9", "oldest to newest", "oldest to most recent", "least recent"],
    ["desc", "descending", "z to a", "9 to 0", "9 to 1", "newest to oldest", "most recent to oldest", "most recent"]
]);

const STEP_LIST = 3;
const unitDesc = 'ambulance|battalion chief|engine|paramedic|ladder|sergeant|search and rescue';
const UNIT_PATTERN = `(((([A-Za-z]{1,3})\\s?)(((([0-9Oo]|zero)\\s?){1,2}|double (zero|O))[1-9]|([0-9Oo]|zero)\\s?[1-9]\\s?([0-9Oo]|zero)|[1-9]\\s?((([0-9Oo]|zero)\\s?){1,2}|double (zero|)))|(${unitDesc})\\s?[1-9][0-9]{0,2}))`;

const UNITS_NAMES = project.snapshot.package.units
    .map(u => u.id.description).concat(
        project.snapshot.package.units
            .map(u => u.id.unitNumber));

const UNIT_INTENT = _(UNITS_NAMES)
    .map(n => utils.getAliases(n, project.unitNameAliases)) // add aliases
    .flatten()
    .uniq()
    .value()
    .join('|');

onCreateUser((p) => {
    if (_.isEmpty(p.auth)) {
        p.auth.tellusAuthenticationToken = AUTH.tellusAuthenticationToken;
        p.auth.tellusDeviceId = AUTH.tellusDeviceId;
        p.auth.tellusBaseUrl = AUTH.tellusBaseUrl;
        p.auth.tellusUsername = AUTH.tellusUsername;
    }

    p.userData.snapshot = new Promise((resolve, reject) => {
        p.userData.snapshotTs = 1;
        resolve(project.snapshot);
//         const t0 = Date.now();
//         if (project.snapshot && p.auth.tellusAuthenticationToken === 'demo') {
//             p.userData.snapshotTs = 1;
//             resolve(project.snapshot);
//         } else {
//             utils.getCachedSnapshot(p, (err, res) => {
//                 if (err) {
//                     const errorStr = err.message ? err.message : err;
//                     console.log(`ERROR: getCachedSnapshot failed` +
//                             ` ${errorStr},` +
//                             ` time: ${Date.now() - t0}`);
//                     reject(errorStr);
//                 } else {
//                     p.userData.snapshotTs = res.ts;
//                     if(p.auth.tellusUsername) {
//                         utils.reportGA(p);
//                     }
//                     resolve(res.snapshot);
//                 }
//             });
//         }
    });

//     p.userData.snapshotInterval = setInterval(() => {
//         const t0 = Date.now();
//         if (project.snapshot && p.auth.tellusAuthenticationToken === 'demo') {
//             p.userData.snapshotTs = 1;
//             p.userData.snapshot = Promise.resolve(project.snapshot);
//         } else {
//             utils.getCachedSnapshot(p, (err, res) => {
//                 if (err) {
//                     console.log(`ERROR: getCachedSnapshot failed` +
//                             ` ${err.message ? err.message : err},` +
//                             ` time: ${Date.now() - t0}`);
//                 } else {
//                     p.userData.snapshot.then((curSnapshot) => {
//                         const newSnapshot = res.snapshot;
//                         if (!_.isEqual(curSnapshot, newSnapshot)) {
//                             p.userData.snapshot = Promise.resolve(newSnapshot);
//                             p.userData.snapshotTs = res.ts;
//                         }
//                     });
//                 }
//             });
//         }
//     }, 20000);
});

onCleanup((p) => {
    if (p.userData && p.userData.snapshotInterval) {
        clearInterval(p.userData.snapshotInterval);
    }
});

clientAPI.updateGPS = (p, param, callback) => {
    p.userData.gps = param;
    callback();
};

clientAPI.getSnapshot = (p, param, callback) => {
    p.userData.snapshot.then((data) => {
        console.log(JSON.stringify(data));
        if (p.userData.snapshotTs && p.userData.snapshotTs == param.ts) {
            callback(null, {ts: p.userData.snapshotTs});
        }
        callback(null, {ts: p.userData.snapshotTs, snapshot: data});
    }).catch((error) => {
        const errStr = error.toString();
        console.log("ERROR: " + errStr);
        callback(errStr);
    });
};

const screenDescriptions = {
    incidentsMap: [
        "incident map",
        "show (nearest|closest) incidents",
        "show (most|) recent (incidents|calls)",
        "show the most recent (incident|call)"
    ],
    incidentsList: "incident list",
    unitsMap: "units map",
    unitsList: "units list",
    incidentDetails: "incident details",
    unitDetails: "unit single",
    settings: "settings",
    unitsFilter: "units filter",
    incidentsFilter: "incidents filter",
    unitsSort: "units sorting",
    incidentsSort: "incidents sorting",
};

function errorHandler(p) {
    return (error) => {
        if (_.isString(error)) {
            const message = project.errorMessages[error];
            p.play(message ? message : error);
        } else {
            console.log("ERROR: " + error.toString());
            p.play('(Sorry,) something went wrong');
        }
    };
}

// todo replace callInfo with this object
const CALL_ATTR = {
    "number": {
        "value": (item, noloc) => `${utils.callNumber(item.id.callNumber)}${!noloc? " at " + utils.address(item.location.address): ""}`,
        "single": (item, order) => `The call number of ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} ${order? '' : 'at ' + utils.address(item.location.address)} is ${utils.callNumber(item.id.callNumber)}`,
        "promt": "Call numbers of the nearest ones are:",
    },
    "status": {
        "value": (item, noloc) => `${utils.callStatus(item)}${!noloc? " at " + utils.address(item.location.address):""}`,
        "single": (item, order) => `The status of ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} ${order? '' : 'at ' + utils.address(item.location.address)} is ${utils.callStatus(item)}`,
        "promt": "Statuses of the nearest ones are:"
    },
    "priority": {
        "value": (item, noloc) => `${item.priority.code}${!noloc? ", at " + utils.address(item.location.address):""}`,
        "single": (item, order) => `The priority of ${order? order : utils.getNature(item.nature)} ${order? 'incident':''}  ${order? '' : 'at ' + utils.address(item.location.address)} is ${item.priority.code}`,
        "promt": "Priority codes of the nearest ones are:",
    },
    "location": {
        "value": item => `${utils.address(item.location.address)}`,
        "single": (item, order) => `The ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} is at ${utils.address(item.location.address)}`,
        "promt": "The nearest ones are at:",
    },
    "address": {
        "value": item => `${utils.address(item.location.address)}`,
        "single": (item, order) => `The ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} is at ${utils.address(item.location.address)}`,
        "promt": "The nearest ones are at:",
    },
    "time": {
        "value": item => `${utils.getTime(item.timeOpened)}`,
        "single": (item, order) => `${order? order : utils.getNature(item.nature)} ${order? 'incident':''} ${order? '' : 'at ' + utils.address(item.location.address)} was registered at ${utils.getTime(item.timeOpened)}`,
        "promt": "The most recent ones were registered at:",
    },
    "priority description": {
        "value": (item, noloc) => `${item.priority.description}${!noloc? ", at " + utils.address(item.location.address):""}`,
        "single": (item, order) => `The priority description of ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} ${order? '' : 'at ' + utils.address(item.location.address)} is ${item.priority.description}`,
        "promt": "Priority descriptions of the nearest ones are:",
    },
    "dispatch center": {
        "value": item => `${item.id.dispatchCenter}`,
        "single": (item, order) => `The dispatch center of ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} ${order? '' : 'at ' + utils.address(item.location.address)} is ${item.id.dispatchCenter}`,
        "promt": "Dispatch centers are:",
    },
    "agency": {
        "value": item => `${item.agency}`,
        "single": (item, order) => `The agency of ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} ${order? '' : 'at ' + utils.address(item.location.address)} is ${item.agency}`,
        "promt": "Agencies are:",
    },
    "type": {
        "value": item => `${item.callType}`,
        "single": (item, order) => `The type of ${order? order : utils.getNature(item.nature)} ${order? '' : 'at ' + utils.address(item.location.address)} is ${item.callType}`,
        "promt": "Types are:",
    },
    "city": {
        "value": item => `${item.location.city}`,
        "single": (item, order) => `The city of ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} is ${item.location.city}`,
        "promt": "Cities are:"
    },
    "comments": {
        "value": item => `${utils.comments(item.comments.map(c => c.text).join("; "))}`,
        "single": (item, order) => `The comments of ${order? order : utils.getNature(item.nature)} ${order? 'incident':''} are ${utils.comments(item.comments.map(c => c.text).join("; "))}`,
        "promt": "Comments are:"
    },
    "details": {
        "value": (call, res) => {
            let unitNumbers = utils.findAssignedUnits(res, call.id.callNumber).map(u => u.id.unitNumber);
            let response = `${utils.callNumber(call.id.callNumber)} call nature is ${utils.getNature(call.nature)}, located at ${utils.address(call.location.address)}. The status is ${utils.callStatus(call)}`;
            if (!_.isEmpty(unitNumbers)) {
                response += ` and the assigned unit${unitNumbers.length > 1 ? "s" : ""} ${unitNumbers.length > 1 ? "are" : "is"} ${utils.joinAnd(unitNumbers)}`
            }
            return response;
        },
        "single": (item, order) => `not implemented`,
        "promt": "not implemented"
    }
};


const UNIT_ATTR = {
    "status":   (item) => utils.unitStatus(item),
    "location": (item) => `latitude: ${item.location.latitude}, longitude: ${item.location.longitude}`,
    "number":   (item) => utils.spacify(item.id.unitNumber),
    "dispatch center": (item) => item.station.dispatchCenter,
    "agency":   (item) => item.id.agency,
}

function playHightlighedItems(p, list, show) {
    list.forEach(item => {
        p.play(utils.highlightCommand(item));
        p.play(show(item));
    });
    p.play(utils.highlightCommand(_.last(list), true));
}

function playFormat(pattern, item, attr) {
    let type = item ? (item.id.callNumber ? "incidents" : "units") : undefined;
    if (_.isFunction(pattern)) {
        return pattern(item, attr);
    } else if (type === "units") {
        return item.id.description;
    } else if (type === "incidents") {
        return utils.callNumber(item);
    } else {
        return utils.spacify(item);
    }
}


function findSimilarUnits(unitName, units) {
    const unitNumberArr = utils.unitNumberVariants(unitName);
    const posUnits = units.filter(u => utils.levenshteinDistance(unitNumberArr[0], u.id.unitNumber) <= 1);
    return posUnits;
}

function cancelFollow() {
    follow(
        'never mind',
        '(cancel|forget) (that|)',
        '(Stop|Exit|End|Shut up)',
        'no',
        p => {
            p.play(`(ok|fine|sure)`);
            p.resolve(null);
        }
    );
}

const similarUnitContextSingle = context(() => {
    follow(
        `$(U* ${UNIT_PATTERN})`,
        p => {
            p.resolve({unitPattern: p.U.value});
        }
    );

    const answerToResult = {
        yes: {ordinal: 0}
    }

    follow(
        `$(ANSWER yes)`,
        p => {
            const answer = p.ANSWER.toLowerCase();
            const res = answerToResult[answer];
            p.resolve(res);
        }
    );

    cancelFollow();

    fallback(`I'm sorry, say yes, no or unit number. You can say cancel to cancel the request.`);
});

const similarUnitContextMulti = context(() => {
    follow(
        `$(U* ${UNIT_PATTERN})`,
        p => {
            p.resolve({unitPattern: p.U.value});
        }
    );

    const answerToResult = {
        first: {ordinal: 0},
        second: {ordinal: 1},
        last: {ordinal: 1},
    }

    follow(
        `$(ANSWER first|second|last)`,
        p => {
            const answer = p.ANSWER.toLowerCase();
            const res = answerToResult[answer];
            p.resolve(res);
        }
    );

    cancelFollow();

    fallback(`I'm sorry, say first, second or unit number. You can say cancel to cancel the request.`);
});

async function askSimilarUnit(p, unitName, units) {
    const similar = findSimilarUnits(unitName, units);
    if (similar.length == 0) {
        p.play(`Can't find unit ${unitName}`);
        p.resolve(null);
        return;
    }
    let resp;
    if (similar.length == 1) {
        p.play(`Did you mean ${similar[0].id.unitNumber}`);
        resp = await p.then(similarUnitContextSingle);
    } else if (similar.length > 1) {
        p.play(`Did you mean ${similar[0].id.unitNumber} or ${similar[1].id.unitNumber}`);
        resp = await p.then(similarUnitContextMulti);
    }
    if (resp == null) {
        p.play(`Cannot find unit ${unitName}`);
        return Promise.resolve(null);
    } else if (resp.unitPattern) {
        const unitNumberArr = utils.unitNumberVariants(resp.unitPattern);
        let unit = units.find(u => unitNumberArr.includes(u.id.unitNumber));
        return Promise.resolve(unit);
    } else if (resp.yes) {
        return Promise.resolve(similar[0]);
    } else if (resp.ordinal != null){
        return Promise.resolve(similar[resp.ordinal]);
    }
}

//ONE INCIDENT
const vCall = visual((state) => {
    return state.highlightedCall ||
        (["incidentsMap", "incidentDetails", "incidentsList"].includes(state.screen) &&
            state.calls && state.calls.length === 1);
});

function inCallContext(p, callback) {
    const callNumber = p.visual.highlightedCall ?
        p.visual.highlightedCall :
        p.visual.calls[0].id.callNumber;
    p.userData.snapshot.then((data) => {
        const call = utils.findCallByCallNumber(data, callNumber);
        if (!call) {
            p.play(`Can't find incident with number: ${callNumber}`);
            return;
        }
        callback(call, data);
    }).catch(errorHandler(p));
}

intent(
    vCall,
    "what is the (incident|call|) $(L location|address)",
    "where is the (call|incident)","where is it",
    p => {
        inCallContext(p,  call =>  p.play(`The incident is (located|) at ${utils.address(call.location.address)}`));
    }
);

intent(
    vCall,
    "(what is the|) (incident|call|) status",
    p => {
        inCallContext(p, call => p.play(`The status of the incident is ${utils.callStatus(call)}`));
    }
);

intent(
    vCall,
    "(what is the|) (incident|call|) priority",
    p => {
        inCallContext(p, call => p.play(`The priority of the incident is ${call.priority.code} ${call.priority.code !== call.priority.description? ", " + call.priority.description:""}`));
    }
);

intent(
    vCall,
    "(what|) time (it|incident|call|) (was|) (opened|logged|registered|)",
    "when was it (opened|logged|registered)",
    p => {
        inCallContext(p, call => p.play(`The (call|incident) was (opened|logged|registered|) at ${utils.getTime(call.timeOpened)}`));
    }
);

intent(
    vCall,
    "(what are the|) (incident|call|) comments (on|) (incident|call|)",
    "read comments",
    p => {
        inCallContext(p, call => p.play(`The comments of the incident are ${utils.comments(call.comments.map(c => c.text).join("; "))}`));
    }
);

intent(
    vCall,
    "(what is the|) (incident|call|) city",
    p => {
        inCallContext(p, call => p.play(`The type of incident is ${call.location.city}`));
    }
);

intent(
    vCall,
    "(what is the|) (incident|call|) nature",
    p => {
        inCallContext(p, call => p.play(`The nature of incident is ${utils.getNature(call.nature)}`));
    }
);

intent(
    vCall,
    "(what is the|) (incident|call|) number",
    p => {
        inCallContext(p, call => p.play(`The number of incident is ${utils.callNumber(call.id.callNumber)}`));
    }
);

intent(
    vCall,
    "(what are the|show) (incident|call|) details",
    p => {
        inCallContext(p, call => {
            p.play({
                "command": "showIncidentDetails",
                "value": call.id.callNumber
            });
            p.play(`The ${utils.getNature(call.nature)} (incident|call) was (opened|logged|registered) at ${utils.getTime(call.timeOpened)} at ${utils.address(call.location.address)}, status is ${utils.callStatus(call)}`)
        });
    }
);

intent(
    vCall,
    "Take me (there|to the incident|to the call)",
    "Get directions",
    "Navigate (there|)",
    p => {
        inCallContext(p, call => {
            p.play({
                "command": "navigate",
                "value": call.id.callNumber
            });
            p.play(`Getting directions to ${utils.address(call.location.address)}`);
        });
    }
);

intent(
    vCall,
    "(what is the|) (incident|call|) dispatch center",
    p => {
        inCallContext(p, call => p.play(`The incident dispatch center is ${call.id.dispatchCenter}`));
    }
);

intent(
    vCall,
    "(what is the|) (incident|call|) agency",
    p => {
        inCallContext(p, call => p.play(`The incident agency is ${call.agency}`));
    }
);

intent(
    vCall,
    "(what|show) (unit|units|car|cars|engine|engines) (are|is) (assigned|responding|dispatched) (to|)",
    p => {
        inCallContext(p, (call, data) => {
            let units = utils.findAssignedUnits(data, call.id.callNumber);
            if (_.isEmpty(units)) {
                p.play(`There are no assigned units`);
                return;
            }
            p.play({
                "command": "showUnitsMap",
                "value": units.map(u => u.id.unitNumber)
            });
            let unitPlay = utils.joinAnd(units.map(u => u.id.description ? u.id.description : utils.spacify(u.id.unitNumber)));
            p.play(`${unitPlay} ${units.length === 1 ? 'is' : 'are'} (assigned|responding|dispatched) to the incident`);
        });
    }
);

//MULTIPLE INCIDENTS
const vIncidentList = visual((state) =>
    ["incidentsMap", "incidentsList"].includes(state.screen) &&
    !(state.screen === "incidentsMap" && !state.bottomPopup) &&
    state.calls && state.calls.length > 1);

const vIncidents = visual((state) =>
    ["incidentsMap", "incidentsList"].includes(state.screen) &&
    state.calls && state.calls.length > 1);

const vIncidentsAny = visual((state) => state.calls && state.calls.length > 1);

function inIncidentsContext(p, callback) {
    const callNumbers = p.visual.calls.map(c => c.id.objectId);
    p.userData.snapshot.then((data) => {
        const incidents = callNumbers
            .map(n => data.package.calls
                .find(c => c.id.objectId === n));
        callback(incidents, data);
    }).catch(errorHandler(p));
}

intent(
    vIncidentsAny,
    `show them on map`,
    p => {
        const callNumbers = p.visual.calls.map(c => c.id.callNumber);
        p.play({
            command: "showIncidentsMap",
            value: callNumbers
        });
        p.play('Here they are');
    }
);

intent(
    vIncidentsAny,
    `show them (on|in) list`,
    p => {
        const callNumbers = p.visual.calls.map(c => c.id.callNumber);
        p.play({
            command: "showIncidentsList",
            value: callNumbers
        });
        p.play('Here they are');
    }
);

intent(
    vIncidentList,
    `(what is the|show|) $(ATTR ${CALL_ATTR_INTENTS}) of (the|) $(ORDINAL) (incident|call|one|)`,
    p => {
        const attr = CALL_ATTR_ALIASES[p.ATTR.toLowerCase()];
        if (CALL_ATTR[attr]) {
            inIncidentsContext(p, (calls) => {
                const call = calls[p.ORDINAL.number - 1];
                if (!call) {
                    p.play(`Can't find incident`);
                    return;
                }
                playCallAttribute(p, attr, call, p.ORDINAL);
            });
        } else {
            p.play(`Can't find attribute ${attr}`);
        }
    }
);

intent(
    vIncidentList,
    "(Take me|Get direction|Navigate) to (the|) $(ORDINAL) (incident|call|)",
    p => {
        inIncidentsContext(p, (calls, data) => {
            const call = calls[p.ORDINAL.number - 1];
            p.play({
                "command": "navigate",
                "value": call.id.callNumber
            });
            p.play(`Getting directions to ${utils.address(call.location.address)}`);
        });
    }
);

intent(
    vIncidents,
    `(whats is the|) $(ATTR* ${CALL_ATTR_INTENTS}) of the $(N~ ${NATURE_INTENTS})`,
    `(whats is the|) $(ATTR* ${CALL_ATTR_INTENTS}) of the $(NP ${NATURE_NOT_FUZZY_INTENTS})`,
    `(what is the|) $(ATTR* ${CALL_ATTR_INTENTS}) (of the|) $(N ${SINGLE_CODES}) (incident|call|)`,
    `(what is the|) $(ATTR* ${CALL_ATTR_INTENTS}) (of the|) $(C* ${DIGIT_CODES_PATTERN}) (incident|call|)`,
    p => {
        const attr = CALL_ATTR_ALIASES[p.ATTR.toLowerCase()];
        let natureCode;
        if (p.C && p.C.value) {
            natureCode = utils.digitCode(p.C.value);
        } else if (p.NP && p.NP.length) {
            natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
        } else if (p.N && p.N.label) {
            natureCode = p.N.label.toUpperCase()
        } else {
            natureCode = p.N.value;
        }
        if (CALL_ATTR[attr]) {
            inIncidentsContext(p, (calls) => {
                const natureCalls = calls.filter(c => c.nature === natureCode);
                if (_.isEmpty(natureCalls)) {
                    p.play(`Can't find incidents with nature ${utils.getNature(natureCode)}`);
                    return;
                }
                let call = natureCalls[0];
                playCallAttribute(p, attr, call);
            });
        } else {
            p.play(`Can't find attribute ${attr}`);
        }
    }
);

intent(
    vIncidents,
    `(what is the|) $(ATTR ${CALL_ATTR_INTENTS}) (of the incident|of the call|) (on|at) $(LOC)`,
    p => {
        const attr = CALL_ATTR_ALIASES[p.ATTR.toLowerCase()];
        inIncidentsContext(p, (calls) => {
            const foundCalls = utils.findCallsByAddr(calls, p.LOC);
            if (!foundCalls.length) {
                p.play(`Can't find incident`);
                return;
            }
            const foundCall = foundCalls[0];
            playCallAttribute(p, attr, foundCall);
        });
    }
);

function playCallAttribute(p, attr, call, order) {
    p.play({
        "command": "highlightIncident",
        "value": call.id.callNumber
    });
    if (attr === DETAILS) {
        p.play({
            "command": "showIncidentDetails",
            "value": call.id.callNumber
        });
        p.play(CALL_ATTR[attr].value(call));
        return;
    }
    p.play(CALL_ATTR[attr].single(call, order));
}

intent(
    vIncidentList,
    `sort (incidents|calls|) by $(ATTR ${Object.keys(SORT_ATTR_CALLS).join('|')}) $(ORDER ${Object.keys(ORDER_ATTR).join('|')}|)`,
    p => {
        const field = SORT_ATTR_CALLS[p.ATTR.toLowerCase()];
        const order = p.ORDER.value ? ORDER_ATTR[p.ORDER.toLowerCase()] : "asc";
        p.play({
            "command": "applyIncidentsSort",
            "field": field,
            "order": order
        });
        p.play("Sorted incidents by " + p.ATTR.toLowerCase());
    }
);

intent(
    vIncidentList,
    `sort (incidents|calls|) by $(O most|least|) recent`,
    p => {
        let field = "time";
        let order = p.O.toLowerCase() === "most" ? "desc" : "asc";
        p.play({
            "command": "applyIncidentsSort",
            "field": field,
            "order": order
        });
        p.play(`Sorted incidents by ${p.O.toLowerCase()} recent`);
    }
);

intent(
    vIncidents,
    `(reset|clear|remove|get rid of) (all|every|) (filter|filters|filtering)`,
    'show all',
    p => {
        clearFilters(p, Call);
        p.play('Incident filters have been cleared');
    }
);

intent(
    vIncidentList,
    `(reset|clear|remove|get rid of) (all|every|) (sort|sorts|sorting)`,
    p => {
        clearSorting(p, Call);
        p.play('Incident sorting have been cleared');
    }
);

intent(
    vIncidentList,
    `(reset|clear|remove|get rid of) (all|every|) (filter|filters|filtering) and (sort|sorts|sorting)`,
    p => {
        clearSorting(p, Call);
        clearFilters(p, Call);
        p.play('Incident filters and sorting have been cleared');
    }
);

intent(
    vIncidents,
    `(show|filter) $(FILTER ${STATUS_INTENTS}|${TYPE_INTENTS}|${DISPATCH_INTENTS}) (incidents|calls|)`,
    p => {
        p.userData.snapshot.then((data) => {
            let statuses = [];
            let types = [];
            let dispatches = [];
            let wrongDispatches = [];
            if (p.FILTERs) {
                statuses = p.FILTERs
                    .map(f => STATUSES_ALIASES[f.toLowerCase()])
                    .filter(Boolean)
                    .map(f => Call + f);
                types = p.FILTERs
                    .map(f => TYPE_ALIASES[f.toLowerCase()])
                    .filter(Boolean);
                dispatches = p.FILTERs
                    .map(f => DC[f.toLowerCase()])
                    .filter(Boolean);
            }
            const callFilters = p.visual.callFilters ? p.visual.callFilters : [];
            const curStatusFilters = callFilters.filter(f => CALL_STATUSES.includes(f));
            const curTypeFilters = callFilters.filter(f => TYPES.includes(f));
            const curDispatches = callFilters.filter(f => DC.includes(f));
            p.play({
                command: "applyIncidentsFilter",
                responseStates: _.union(curStatusFilters, statuses),
                callTypes: _.union(curTypeFilters, types),
                dispatchCenters: _.union(curDispatches, dispatches)
            });

            p.play(`Showing ${p.FILTERs.join(" ")} (incidents|calls)`);
        });
    }
);

intent(
    vIncidentList,
    '(show|) $(ORDINAL)',
    p => {
        inIncidentsContext(p, (incidents) => {
            const incident = incidents[p.ORDINAL.number - 1];
            if (!incident) {
                p.play(`Can't find incident`);
                return;
            }
            p.play({
                "command": "highlightIncident",
                "value": incident.id.callNumber
            });
            p.play({
                "command": "showIncidentDetails",
                "value": incident.id.callNumber
            });
            p.play(`${utils.getNature(incident.nature)} at ${utils.address(incident.location.address)}`);
        });
    }
);

intent(
    vIncidents,
    `(show|) (incident|call|) (on|at) $(LOC)`,
    p => {
        inIncidentsContext(p, (calls, data) => {
            const foundCalls = utils.findCallsByAddr(calls, p.LOC, p);
            if (!foundCalls.length) {
                p.play(`Can't find incident`);
                return;
            }
            console.log(foundCalls.length);
            const incident = foundCalls[0];
            p.play({
                "command": "showIncidentDetails",
                "value": incident.id.callNumber
            });
            p.play(`${utils.getNature(incident.nature)} at ${utils.address(incident.location.address)}`);
        });
    }
);

function unitLocation(p, unit) {
    p.play({
        "command": "showUnitMap",
        "value": unit.id.unitNumber
    });
    p.play(`${unit.id.description} is here`);
}

const unitIncidentInfo = (p, unit, data) => {
    const incidents = utils.findAssignedIncidents(data, unit.id.unitNumber);
    if (!incidents.length) {
        p.play('No assigned incidents');
        return;
    }
    p.play({
        "command": "showIncidentMap",
        "value": incidents[0].id.callNumber
    });
    p.play(`${unit.id.description} is ${utils.unitStatus(unit)}. It's assigned to ${incidents[0].callType} at ${utils.address(incidents[0].location.address)}`);
};

const unitDetails = (p, unit, data) => {
    p.play({
        "command": "showUnitDetails",
        "value": unit.id.unitNumber
    });
    p.play(`${unit.id.description} is ${utils.unitStatus(unit)}.`);
    const incidents = utils.findAssignedIncidents(data, unit.id.unitNumber);
    if (incidents.length > 0) {
        p.play(`It's assigned to ${incidents[0].callType} at ${utils.address(incidents[0].location.address)}`);
    } else {
        p.play(`It's not assigned to any incident at the moment.`);
    }
};

const unitIncidentLocation = (p, unit, data) => {
    const incidents = utils.findAssignedIncidents(data, unit.id.unitNumber);
    if (!incidents.length) {
        p.play('No assigned incidents');
        return;
    }
    p.play({
        "command": "showIncidentMap",
        "value": incidents[0].id.callNumber
    });
    p.play(`${unit.id.description} assigned to ${utils.address(incidents[0].location.address)}`);
};

const unitIncidentDetails = (p, unit, data) => {
    const incidents = utils.findAssignedIncidents(data, unit.id.unitNumber);
    if (!incidents.length) {
        p.play('No assigned incidents');
        return;
    }
    p.play({
        "command": "showIncidentDetails",
        "value": incidents[0].id.callNumber
    });
    p.play('Here are the incident details');
};

const oneUnitFunctions = {
    status: (p, unit) => p.play(`${unit.id.description}'s status is ${utils.unitStatus(unit)}`),
    agency: (p, unit) => p.play(`${unit.id.description}'s agency is ${unit.id.agency}`),
    dispatch: (p, unit) => p.play(`${unit.id.description}'s dispatch (center|) is ${unit.station.dispatchCenter}`),
    callDetails: unitIncidentDetails,
    callLocation: unitIncidentLocation,
    location: unitLocation,
    callInfo: unitIncidentInfo,
    details: unitDetails,
    time: (p, unit) => p.play(`${unit.id.description} status was updated to ${utils.unitStatus(unit)} at ${api.moment(unit.status.timestamp).format("h:mmA")}`),

};

//ONE UNIT
const vUnit = visual((state) => {
    return state.highlightedUnit ||
        (["unitsMap", "unitDetails"].includes(state.screen) &&
            state.units && state.units.length == 1)
});

function inUnitContext(p, callback) {
    const unitNumber = p.visual.highlightedUnit ?
        p.visual.highlightedUnit :
        p.visual.units[0].id.unitNumber;
    p.userData.snapshot.then((data) => {
        const unit = utils.findUnitByUnitNumber(data, unitNumber);
        if (!unit) {
            p.play("Can't find unit");
            return;
        }
        callback(unit, data);
    }).catch(errorHandler(p));
}

intent(
    vUnit,
    `(what is the|) (unit|) $(ATTR ${UNIT_ATTR_INTENTS})`,
    p => {
        const attr = UNIT_ATTR_ALIASES[p.ATTR.toLowerCase()];
        if (oneUnitFunctions[attr]) {
            inUnitContext(p, (unit, data) => oneUnitFunctions[attr](p, unit, data));
        } else {
            p.play(`Can't find attribute ${attr}`);
        }
    }
);

intent(
    vUnit,
    "(What|Which) incident is (it|unit|) (assigned to|responding on)",
    p => {
        inUnitContext(p, (unit, data) => unitIncidentInfo(p, unit, data));
    }
);

intent(
    vUnit,
    "where (is the|) (call|incident)",
    p => {
        inUnitContext(p, (unit, data) => unitIncidentLocation(p, unit, data));
    }
);

intent(
    vUnit,
    "(what time|when) was the (unit|) (status|) updated",
    "(unit|) update time",
    p => {
        inUnitContext(p, unit => {
            oneUnitFunctions.time(p, unit);
        });
    }
);

//MULTIPLE UNITS
const vUnitList = visual((state) =>
    ["unitsMap", "unitsList"].includes(state.screen) &&
    !(state.screen === "unitsMap" && !state.bottomPopup));

const vUnits = visual((state) =>
    ["unitsMap", "unitsList"].includes(state.screen));

function inUnitsContext(p, callback) {
    const unitsIds = p.visual.units.map(c => c.id.objectId);
    p.userData.snapshot.then((data) => {
        const units = unitsIds
            .map(n => data.package.units
                .find(c => c.id.objectId === n));
        callback(units, data);
    }).catch(errorHandler(p));
}

intent(
    vUnitList,
    `sort (units|) by $(ATTR ${Object.keys(SORT_ATTR_UNITS).join('|')}) $(ORDER ${Object.keys(ORDER_ATTR).join('|')}|)`,
    p => {
        const field = SORT_ATTR_UNITS[p.ATTR.toLowerCase()];
        const order = p.ORDER.value ? ORDER_ATTR[p.ORDER.toLowerCase()] : "asc";
        p.play({
            "command": "applyUnitsSort",
            "field": field,
            "order": order
        });
        p.play("Sorted units by " + p.ATTR.toLowerCase());
    }
);

intent(
    vUnitList,
    `show them on map`,
    p => {
        const unitNumbers = p.visual.units.map(u => u.id.unitNumber);
        p.play({
            command: "showUnitsMap",
            value: unitNumbers
        });
        p.play('Here they are');
    }
);

intent(
    vUnitList,
    `show them on list`,
    p => {
        const unitNumbers = p.visual.units.map(u => u.id.unitNumber);
        p.play({
            command: "showUnitsList",
            value: unitNumbers
        });
        p.play('Here they are');
    }
);

intent(
    vUnits,
    `(reset|clear|remove|get rid of) (all|every|) (filter|filters|filtering)`,
    'show all',
    p => {
        clearFilters(p, Unit);
        p.play('Unit filters have been cleared');
    }
);

intent(
    vUnits,
    `(reset|clear|remove|get rid of) (all|every|) (sort|sorts|sorting)`,
    p => {
        clearSorting(p, Unit);
        p.play('Unit sorting have been cleared');
    }
);

intent(
    vUnits,
    `(reset|clear|remove|get rid of) (all|every|) (filter|filters|filtering) and (sort|sorts|sorting)`,
    p => {
        clearSorting(p, Unit);
        clearFilters(p, Unit);
        p.play('Unit filters and sorting have been cleared');
    }
);

intent(
    vUnits,
    `(show|filter) $(FILTER ${STATUS_INTENTS}|${TYPE_INTENTS}) (units|)`,
    p => {
        const statuses = p.FILTERs
            .map(f => STATUSES_ALIASES[f.toLowerCase()])
            .filter(Boolean)
            .map(f => Unit + f);
        const types = p.FILTERs
            .map(f => TYPE_ALIASES[f.toLowerCase()])
            .filter(Boolean);
        const curStatusFilters = p.visual.unitFilters.filter(f => UNIT_STATUSES.includes(f));
        const curTypeFilters = p.visual.unitFilters.filter(f => TYPES.includes(f));
        p.play({
            command: "applyUnitsFilter",
            responseStates: _.union(curStatusFilters, statuses),
            unitTypes: _.union(curTypeFilters, types)
        });
        p.play('Here they are');
    }
);

intent(
    vUnits,
    '(show|) $(ORDINAL)',
    p => {
        inUnitsContext(p, (units) => {
            const unit = units[p.ORDINAL.number - 1];
            if (!unit) {
                p.play(`Can't find unit`);
                return;
            }
            p.play({
                "command": "showUnitDetails",
                "value": unit.id.unitNumber
            });
            p.play(`Here are ${unit.id.description}'s details`);
        });
    }
);

intent(
    vUnitList,
    `(what is the|) $(ATTR ${UNIT_ATTR_INTENTS}) of (the|) $(ORDINAL) (unit|one|)`,
    p => {
        const attr = UNIT_ATTR_ALIASES[p.ATTR.toLowerCase()];
        if (oneUnitFunctions[attr]) {
            inUnitsContext(p, (units, data) => {
                const unit = units[p.ORDINAL.number - 1];
                if (!unit) {
                    p.play(`Can't find unit`);
                    return;
                }
                p.play({
                    "command": "highlightUnit",
                    "value": unit.id.unitNumber
                });
                oneUnitFunctions[attr](p, unit, data);
            });
        } else {
            p.play(`Can't find attribute ${attr}`);
        }
    }
);

intent(
    vUnits,
    `(what is|) $(ATTR ${UNIT_ATTR_INTENTS}) (of|) (unit|) $(U* ${UNIT_PATTERN})`,
    `(what is|) $(ATTR ${UNIT_ATTR_INTENTS}) (of|) (unit|) $(U ${UNIT_INTENT})`,
    p => {
        const attr = UNIT_ATTR_ALIASES[p.ATTR.toLowerCase()];
        if (oneUnitFunctions[attr]) {
            inUnitsContext(p, async (units, data) => {
                const unitName = p.U.label ? p.U.label : p.U.value;
                const unitNumberArr = utils.unitNumberVariants(unitName);
                let unit = units.find(u => unitNumberArr.includes(u.id.unitNumber));
                if (!unit) {
                    unit = data.package.units.find(u => unitNumberArr.includes(u.id.unitNumber));
                }
                if (!unit) {
                    unit = await askSimilarUnit(p, unitName, data.package.units);
                }
                if (!unit) {
                    return;
                }
                p.play({
                    "command": "highlightUnit",
                    "value": unit.id.unitNumber
                });
                oneUnitFunctions[attr](p, unit, data);
            });
        } else {
            p.play(`Can't find attribute ${attr}`);
        }
    }
);

//HELP
const v1 = visual({"screen": _});

intent(
    v1,
    "what (screen|page) (is this|am I on|)", "what is this",
    p => {
        let desc = screenDescriptions[p.visual.screen];
        if (desc) {
            if (_.isArray(desc)) {
                desc = desc[0];
            }
            p.play(`This is a ${desc} screen`);
        } else {
            p.play(`This is Alan Safety application`);
        }
    }
);


intent(
    v1,
    "what (commands|questions|) can I (do|ask) (here|)", "help me",
    p => {
        let desc = screenDescriptions[p.visual.screen];
        if (desc) {
            if (_.isArray(desc)) {
                desc = _.sampleSize(desc.slice(1), 3);
                desc = desc.join(", ");
                if (desc.length) {
                    p.play(`You can ask: ${desc}`);
                    return;
                }
            }
        }
        p.play(`there is no specific commands on this screen`);
    }
);

intent(
    "(Alan|) what commands do you know?",
    "What can you do?", "How can you help me?",
    reply(
        "(You can ask me things like|You can use commands like): What are recent incidents? What's the status of the vegetation fire? Where's CAR32?"
    )
);

// Reapeat items group by group
const repeatListItems = context(() => {
    title("repeat items");

    follow(
        "(yes|sure|ok|next|show more)",
        p => {
            let {state} = p;
            if (!state.items) {
                p.play("There are no items");
                console.log("There are no items");
                return;
            }
            if (state.from + state.step > state.items.length) {
                state.step = state.from + state.step - state.items.length + 1;
            }
            let to = Math.min(state.from + state.step, state.items.length);
            let showItems = state.items.slice(state.from, to);
            if (_.isEmpty(showItems)) {
                let type = state.items[0].id.callNumber ? "incidents" : "units";
                p.play(`There are no more ${type}`);
                p.resolve(null);
                return;
            } else {
                let value = _.isFunction(state.commandValue) ? _.map(showItems, i => state.commandValue(i)) : showItems;
                p.play({
                    "command": state.command,
                    "value": value
                });
                playHightlighedItems(p, showItems, (i) => playFormat(state.pattern, i, state.attr));
                if (to < state.items.length) {
                    p.play(`Do you want to hear more?`);
                }
            }
            p.state.from = to;
        }
    );

    follow(
        "(repeat|repeat please|say again)",
        p => {
            let {state} = p;
            if (!state.items) {
                p.play("There are no items");
                console.log("There are no items");
                return;
            }
            let showItems = state.items.slice(state.from - state.step, state.from);
            playHightlighedItems(p, showItems, (i) => playFormat(state.pattern, i));
            if (state.from < state.items.length) {
                p.play(`Do you want to hear more?`);
            }
        }
    );

    follow(
        "(no|next time|not now|later|nope|stop)",
        p => {
            if (!p.state.items) {
                p.play("No items");
                return;
            }
            p.play("OK");
            p.resolve(null);
        }
    );

    follow(
        "(Has|) anyone been (dispatched|assigned)?",
        "(What are |Show) units (assigned|responding|dispatched)",
        p => {
            let {item, order, message} = getCurrentItem(p.state);
            if (message) {
                p.play(message);
            }
            if (item.id.unitNumber) {
                assigned(p, item, order);
            } else {
                p.play(`Can't find any assigned units`);
            }
        }
    );

    function assigned(p, item, order) {
        p.userData.snapshot.then(result => {
            let units = utils.findAssignedUnits(result, item.id.callNumber);
            if (_.isEmpty(units)) {
                p.play(`The ${order} incident is not assigned to any units`);
                return;
            }
            let unitPlay = utils.joinAnd(units.map(u => u.id.description ? u.id.description : utils.spacify(u.id.unitNumber)));
            p.play(`Assigned ${_.size(units > 1) ? "units are" : "unit is"} ${unitPlay}`);
        }).catch(errorHandler(p));
    }

    function getCurrentItem(state, seq = state.order) {
        let n = ["one item", "two items", "three items"];
        let current = 0;
        let index = state.from - state.step;
        let order = seq;
        switch (order) {
            case "first" :
                current = 0;
                break;
            case "second":
            case "middle":
                current = 1;
                break;
            case "third":
                current = 2;
                break;
            case "last":
                current = Math.min(2, state.items.length - index - 1);
                break;
            default:
                current = 0;
        }
        let message;
        if (index + current >= state.items.length) {
            message = `There is only ${n[state.items.length - index - 1]} in the list.`;
            order = state.items.length - index === 1 ? "" : "first";
        } else {
            index += current;
        }
        let item = state.items[index];
        return {item, order, message}
    }
    
    follow(
        "(show|what is|what are) (the|) $(W status|number|details|location|address|nature|city|priority|type|time|comments|assigned|dispatch center|agency) (of the|) $(N first|second|third|last|middle|) (unit|call|incident|item|)",
        p => {
            let {state} = p;
            if (!state.items) {
                p.play("There are no items");
                return;
            }

            let description = !p.W.value ? "details" : p.W.value;
            let {item, order, message} = getCurrentItem(state, p.N.value || state.order);
            if (message) {
                p.play(message);
            }
            if (_.size(state.items) > 1 && _.isEmpty(order)) {
                order = "first";
            }
            if (!order) order = "";
            let itemType = utils.getItemType(item);
            p.play(description === "details" ? utils.detailsCommand(item) : utils.highlightCommand(item));
            if (description === "details") {
                p.userData.snapshot.then(data => {
                    p.play(CALL_ATTR[description].value(item, data));
                }).catch(errorHandler(p));
            } else if (CALL_ATTR[description]) {
                p.play(CALL_ATTR[description].single(item, order));
            } else {
                p.play(`The ${description} attribute is not available for ${itemType === project.Type.CALL ? "incident" : "unit"}`);
            }
            p.state.order = order;
        }
    );
});

//GLOBAL INTENTS

intent(
    `(Reset|clear|remove|get rid of) (all|every|) (filter|filters|filtering)`,
    p => {
        clearFilters(p, All);
        p.play('All filters have been cleared');
    }
);

intent(
    `(Reset|clear|remove|get rid of) (all|every|) (sort|sorts|sorting)`,
    p => {
        clearSorting(p, All);
        p.play('All sorting have been cleared');
    }
);

intent(
    `(Reset|clear|remove|get rid of) (all|every|) (filter|filters|filtering) and (sort|sorts|sorting)`,
    p => {
        clearFilters(p, All);
        clearSorting(p, All);
        p.play('All filters and sorting have been cleared');
    }
);

intent(
    `(show|what are the) $(S ${STATUS_INTENTS}) $(T unit_)`,
    p => {
        let status = Unit + STATUSES_ALIASES[p.S.toLowerCase()];
        listUnits(p, p.S, p.T, null, u => u.responseState === status);
    }
);

intent(
    `(show|what are the) $(R ${TYPE_INTENTS}) $(T unit_)`,
    p => {
        let unitType = TYPE_ALIASES[p.R.toLowerCase()];
        listUnits(p, p.R, p.T, null, u => u.discipline === unitType);
    }
);

intent(
    `(show|what are the) $(S ${STATUS_INTENTS}) $(R ${TYPE_INTENTS}) $(T unit_)`,
    p => {
        let status = Unit + STATUSES_ALIASES[p.S.toLowerCase()];
        let unitType = TYPE_ALIASES[p.R.toLowerCase()];
        listUnits(p, p.S + " " + p.R, p.T, null, u => u.responseState === status && u.discipline === unitType);
    }
);

intent(
    `(show|what are the) $(S ${STATUS_INTENTS}) $(T incident_|call_)`,
    p => {
        let status = Call + STATUSES_ALIASES[p.S.toLowerCase()];
        listCallsFilter(p, p.S, p.T, null, u => u.responseState === status);
    }
);

intent(
    `(show|what are the) $(F most recent|highest priority|) $(R ${TYPE_INTENTS}) $(T incident_|call_)`,
    p => {
        let callType = TYPE_ALIASES[p.R.toLowerCase()];
        let sort = {
            "highest priority": (a, b) => parseInt(a.priority.code) - parseInt(b.priority.code),
            "most recent": (a, b) => new Date(b.timeOpened) - new Date(a.timeOpened)
        };
        listCallsFilter(p, p.F ? p.F + " " + p.R : p.R, p.T, p.F ? sort[p.F] : null, u => u.callType === callType);
    }
);

intent(
    `(show|what are the) $(S ${STATUS_INTENTS}) $(R ${TYPE_INTENTS}) $(T incident_|call_)`,
    p => {
        let status = Call + STATUSES_ALIASES[p.S.toLowerCase()];
        let callType = TYPE_ALIASES[p.R.toLowerCase()];
        listCallsFilter(p, p.S + " " + p.R, p.T, null, u => u.responseState === status && u.callType === callType);
    }
);

intent(
    `(show|what are) (the|) $(R ${TYPE_INTENTS}) $(D ${DISPATCH_INTENTS}) $(T incidents|calls)`,
    `(what are|what is|show) (the|) $(D ${DISPATCH_INTENTS}) $(R ${TYPE_INTENTS}) $(T incident_|call_)`,
    `(what are|what is|show) (the|) $(T incident_|call_) from $(D ${DISPATCH_INTENTS})`,
    p => {
        let dispatch = DC[p.D.value];
        let callType = p.R ? TYPE_ALIASES[p.R.toLowerCase()] : "";
        listCallsFilter(p, callType + " " + dispatch, p.T, null,
            u => dispatch === u.id.dispatchCenter && (!p.R || u.callType === callType));
    }
);

intent(
    `show $(U* ${UNIT_PATTERN}) details`,
    `What are the details on $(U* ${UNIT_PATTERN})`,
    `show $(U ${UNIT_INTENT}) details`,
    `What are the details on $(U ${UNIT_INTENT})`,
    p => {
        const unitName = p.U.label ? p.U.label : p.U.value;
        const unitNumberArr = utils.unitNumberVariants(unitName);
        p.userData.snapshot.then(async result => {
            let unit = result.package.units.find(u => unitNumberArr.includes(u.id.unitNumber.toUpperCase()));
            if (!unit) {
                unit = await askSimilarUnit(p, unitName, result.package.units);
            }
            if (!unit) {
                return;
            }
            const calls = utils.findAssignedIncidents(result, unit.id.unitNumber);
            const assignedMessage = calls.length ?
                `It's assigned to ${utils.getNature(calls[0].nature)} at ${utils.address(calls[0].location.address)}` +
                (calls[0].location.city? ` in ${calls[0].location.city}` : '') : '';
            p.play({
                "command": "showUnitDetails",
                "value": unit.id.unitNumber
            });
            p.play(`${unit.id.description} is ${utils.unitStatus(unit)}. ${assignedMessage}`);
        });
    }
);

intent(
    `what (incident|call) is $(U* ${UNIT_PATTERN}) (unit|) $(ASSIGNED responding|assigned) to`,
    `what is (the|) $(ATTR ${Object.keys(UNIT_ATTR).join(`|`)}) and $(ASSIGNED responding|assigned|) (incident|call) (for|of) $(U* ${UNIT_PATTERN})`,
    `what (incident|call) is $(U ${UNIT_INTENT}) (unit|) $(ASSIGNED responding|assigned) to`,
    `what is (the|) $(ATTR ${Object.keys(UNIT_ATTR).join(`|`)}) and $(ASSIGNED responding|assigned|) (incident|call) (for|of) $(U ${UNIT_INTENT})`,
    p => {
        const unitName = p.U.label ? p.U.label : p.U.value;
        const attr = p.ATTR ? p.ATTR.toLowerCase() : "status";
        const unitNumberArr = utils.unitNumberVariants(unitName);
        p.userData.snapshot.then(async data => {
            let unit = data.package.units.find(u => unitNumberArr.includes(u.id.unitNumber.toUpperCase()));
            if (!unit) {
                unit = await askSimilarUnit(p, unitName, data.package.units);
            }
            if (!unit) {
                return;
            }
            const calls = utils.findAssignedIncidents(data, unit.id.unitNumber);
            if (_.isEmpty(calls)) {
                p.play(`The unit ${unit.id.description} is not assigned to any incidents`);
                return;
            }
            const call = calls[0];
            clearFilters(p, Call);
            p.play({
                command: "showIncidentMap",
                value: call.id.callNumber
            });
            p.play(`${p.U} is ${p.ASSIGNED.value? p.ASSIGNED : 'assigned'} to ${utils.getNature(call.nature)} at ${utils.address(call.location.address)}, ${attr} is ${UNIT_ATTR[attr](unit)}.`);
        }).catch(errorHandler(p));
    }
);

intent(
    `(where is|show me the location of) $(U* ${UNIT_PATTERN}) (unit|) (on map|)`,
    `(where is|show me the location of) $(U ${UNIT_INTENT}) (unit|) (on map|)`,
    p => {
        const unitName = p.U.label ? p.U.label : p.U.value;
        const unitNumberArr = utils.unitNumberVariants(unitName);
        p.userData.snapshot.then(async data => {
            let unit = data.package.units.find(u => unitNumberArr.includes(u.id.unitNumber.toUpperCase()));
            if (!unit) {
                unit = await askSimilarUnit(p, unitName, data.package.units);
            }
            if (!unit) {
                return;
            }
            clearFilters(p, Unit);
            unitLocation(p, unit);
        });
    }
);

intent(
    `(show|what are the) $(T incident_|call_) $(I in|at) $(LOC)`,
    p => {
        p.userData.snapshot.then((result) => {
            let calls = utils.findCallsByAddr(result.package.calls, p.LOC.value);
            if (_.isEmpty(calls)) {
                p.play(`There are no active ${p.T.value} in ${p.LOC.value}`);
                return;
            }
            calls = calls.sort((a, b) => new Date(b.timeOpened) - new Date(a.timeOpened));
            if (!utils.isPlural(p.T, calls)) {
                calls = [calls[0]];
                if (p.T.value.endsWith("s")) {
                    p.T.value = p.T.value.substring(0, p.T.value.length - 1);
                }
            }
            clearFilters(p, Call);
            listObjects(p,
                {
                    items: calls,
                    step: STEP_LIST,
                    pattern: (item) => [utils.getNature(item.nature), "at", utils.address(item.location.address),
                        item.location.city? `in ${item.location.city}` : ''].join(' '),
                    command: "showIncidentsMap",
                    commandValue: (item) => item.id.callNumber,
                    promt: `There ${utils.isPlural(p.T, calls) ? "are" : "is"} ${_.size(calls)} ${p.T.value} ${p.I.value} ${p.LOC.value}: `,
                });
        });
    }
);

intent(
    `(show|what are the) $(R ${TYPE_INTENTS}) $(T incident_|call_) in $(LOC)`,
    p => {
        const callType = TYPE_ALIASES[p.R.value];
        p.userData.snapshot.then(data => {
            const callsByCallType = data.package.calls.filter(c => c.callType == callType);
            const calls = utils.findCallsByAddr(callsByCallType, p.LOC.value);
            calls.sort((a, b) => new Date(b.timeOpened) - new Date(a.timeOpened));
            p.play({
                "command": "applyIncidentsFilter",
                "callTypes": [callType]
            });
            listCalls(p, p.R.value, p.T, calls);
        }).catch(errorHandler(p));
    }
);

intent(
    `(show|what are|what is|find|where is|where are) (most|) $(R current|recent|last|latest) $(T incident_|call_)`,
    p => {
        listCallsFilter(p, "most recent", p.T, (a, b) => new Date(b.timeOpened) - new Date(a.timeOpened));
    }
);

intent(
    `(show|what are the) (highest|most) priority $(T incident_|call_)`,
    p => {
        let pattern = item => ["priority", item.priority.code, utils.getNature(item.nature), "at", utils.address(item.location.address)].join(" ");
        listCallsFilter(p, "highest priority", p.T, (a, b) => parseInt(a.priority.code) - parseInt(b.priority.code), null, pattern);
    }
);


intent(
    `(where|what) (is|are|) the $(R nearest|closest) $(T incident_|call_)`,
    `(find|show) (the|) $(R nearest|closest) $(T incident_|call_)`,
    p => {
        let coords = utils.getCurrentCoordinates(p);
        let sort = (a, b) => utils.getDistanceLatLon(coords, a.location) - utils.getDistanceLatLon(coords, b.location);
        listCallsFilter(p, p.R.value, p.T, sort);
    }
);

intent(
    `(what are the|show) $(S recent|nearest|) $(N~ ${NATURE_INTENTS}) $(T incident_|call_)`,
    `(what are the|show) $(S recent|nearest|) $(NP ${NATURE_NOT_FUZZY_INTENTS}) $(T incident_|call_)`,
    `(what are the|show) $(S recent|nearest|) $(N ${SINGLE_CODES}) $(T incident_|call_)`,
    `(what are the|show) $(S recent|nearest|) $(C* ${DIGIT_CODES_PATTERN}) $(T incident_|call_)`,
    p => {
        let prefix = p.S? p.S.value: "";
        let natureCode;
        if (p.C && p.C.value) {
            natureCode = utils.digitCode(p.C.value);
        } else if (p.NP && p.NP.length) {
            natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
        } else if (p.N.label) {
            natureCode = p.N.label.toUpperCase();
        } else {
            natureCode = p.N.value;
        }
        let callString = p.T.value;
        let sortBy;
        switch(prefix) {
            case "nearest":
                let coords = utils.getCurrentCoordinates(p);
                sortBy = (a, b) => utils.getDistanceLatLon(coords, a.location) - utils.getDistanceLatLon(coords, b.location);
                break;
            default:
                sortBy = (a, b) => new Date(b.timeOpened) - new Date(a.timeOpened);
        }
        showIncidentsByNature(p, {natureCode, sortBy, prefix, callString});
    }
);

intent(
    `(what|how many) $(T unit_|car_|engine_) (are|is) (assigned to|on|responding to) $(R~ ${NATURE_INTENTS})`,
    `(what|how many) $(T unit_|car_|engine_) (are|is) (assigned to|on|responding to) $(NP ${NATURE_NOT_FUZZY_INTENTS})`,
    `(what|how many) $(T unit_|car_|engine_) (are|is) (assigned to|on|responding to) $(R ${SINGLE_CODES})`,
    `(what|how many) $(T unit_|car_|engine_) (are|is) (assigned to|on|responding to) $(C* ${DIGIT_CODES_PATTERN})`,
    p => {
        p.userData.snapshot.then(res => {
            let natureCode;
            if (p.C && p.C.value) {
                natureCode = utils.digitCode(p.C.value);
            } else if (p.NP && p.NP.length) {
                natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
            } else if (p.R.label) {
                natureCode = p.R.label.toUpperCase();
            } else {
                natureCode = p.R.value;
            }
            let calls = _.filter(res.package.calls, c => c.nature === natureCode);
            calls = calls.sort((a, b) => new Date(b.timeOpened) - new Date(a.timeOpened));
            let unitsMap = {};
            calls.forEach(call => {
                let unitNumbers = utils.findAssignedUnits(res, call.id.callNumber).map(u => u.id.description || u.id.unitNumber);
                if (!_.isEmpty(unitNumbers)) {
                    unitsMap[call.id.callNumber] = { unitNumbers, address: call.location.address};
                }
            });
            let callsCount = _.size(calls);
            if (callsCount > 1) {
                p.play(`There are ${callsCount} ${utils.getNature(natureCode)} incidents.`);
                p.play({
                    "command": "showIncidentsMap",
                    "value": calls.map(c => c.id.callNumber)
                });

            }
            if (_.isEmpty(unitsMap)) {
                p.play(`There are no units assigned to the ${utils.getNature(natureCode)}`);
                return;
            }
            clearFilters(p, Unit);
            Object.keys(unitsMap).forEach(k => {
                let v = unitsMap[k];
                let isOrAre = _.size(v.unitNumbers) > 1 ? "are" : "is";
                if (callsCount === 1) {
                    p.play({
                        "command": "showIncidentDetails",
                        "value": k
                    });
                }
                p.play(`${utils.joinAnd(v.unitNumbers)} ${isOrAre} responding to ${utils.getNature(natureCode)} at ${v.address}`);
            });
        });
    }
);

function playAttrByNature(p, natureCode, attr, location = "", locPrefix = "") {
    let coords = utils.getCurrentCoordinates(p);
    let sortByDist = (a, b) =>  utils.getDistanceLatLon(coords, a.location) - utils.getDistanceLatLon(coords, b.location);
    let sortByDate = (a, b) => new Date(b.timeOpened) - new Date(a.timeOpened);

    p.userData.snapshot.then(result => {
        let config = CALL_ATTR[attr];
        if (attr === DETAILS || !config) {
            console.log(`Attribute ${attr} is not allowed here`);
            return;
        }
        let sorting = attr === "time" ? sortByDate : sortByDist;
        let calls = result.package.calls.filter(c => c.nature === natureCode);
        if(location) {
            calls = utils.findCallsByAddr(calls, location);
        }
        calls = calls.sort(sorting);
        if (_.isEmpty(calls)) {
            p.play(`${utils.getNature(natureCode)} incident is not found ${locPrefix} ${location}`);
            return;
        }
        let promt, pattern, command;
        if (_.size(calls) > 1) {
            promt = `There are ${_.size(calls)} ${utils.getNature(natureCode)} incidents ${config.promt} ${locPrefix} ${location}`;
            pattern = config.value;
            command = "showIncidentsMap";
        } else {
            promt = config.single(calls[0]);
            pattern = () => ``;
            command = (attr === "location" || attr === "address") ? "showIncidentsMap" : "showIncidentDetails";
        }
        let params = {
            items: calls,
            step: STEP_LIST,
            pattern: pattern,
            command: command,
            commandValue: (item) => item.id.callNumber,
            promt: promt,
        };
        clearFilters(p, Call);
        listObjects(p, params)
    }).catch(errorHandler(p));
}

function multiAttributeItem(item, attr) {
    let s = "", showAddr = true;
    if (attr.includes("address") || attr.includes("location")) {
        s += `is located at ${CALL_ATTR.address.value(item, true)}`
        if(attr.indexOf("address")!==-1) {
            attr.splice(attr.indexOf("address"), 1);
        }
        if(attr.indexOf("location")!==-1) {
            attr.splice(attr.indexOf("location"), 1);
        }
        showAddr = false;
    }
    for (const a of attr) {
        s += s ? " and the ":"";
        s += `${a} is ${CALL_ATTR[a].value(item, true)}`;
    }

    return s + (showAddr? ` for (call|incident) at ${CALL_ATTR.address.value(item)}`:'');
}

function play2AttrByNature(p, natureCode, attributes, location = "", locPrefix = "") {
    let coords = utils.getCurrentCoordinates(p);
    let sortByDist = (a, b) =>  utils.getDistanceLatLon(coords, a.location) - utils.getDistanceLatLon(coords, b.location);
    let sortByDate = (a, b) => new Date(b.timeOpened) - new Date(a.timeOpened);
    const attr = _.isArray(attributes)? attributes : [attributes];
    p.userData.snapshot.then(result => {
        attributes = attributes.filter(a => a !== DETAILS && CALL_ATTR[a]);

        let calls = result.package.calls.filter(c => c.nature === natureCode);
        if(location) {
            calls = utils.findCallsByAddr(calls, location);
        }

        let sorting = attributes.includes("time") ? sortByDate : sortByDist;
        calls = calls.sort(sorting);
        if (_.isEmpty(calls)) {
            p.play(`${utils.getNature(natureCode)} incident is not found ${locPrefix} ${location}`);
            return;
        }
        let promt, pattern="", command;
        let config = CALL_ATTR[attr];
        if (_.size(calls) > 1) {
            command = "showIncidentsMap";
            promt = `There are ${_.size(calls)} ${utils.getNature(natureCode)} incidents.`;
            pattern = "The " + multiAttributeItem
        } else {
            promt = `The ${utils.getNature(natureCode)} incident ` + multiAttributeItem(calls[0], attr);
            pattern = () => ``;
            command = ("location" in attributes || "address" in attributes) ? "showIncidentsMap" : "showIncidentDetails";
        }
        let params = {
            items: calls,
            step: STEP_LIST,
            pattern: pattern,
            attr: attributes,
            command: command,
            commandValue: (item) => item.id.callNumber,
            promt: promt,
        };
        clearFilters(p, Call);
        listObjects(p, params)
    }).catch(errorHandler(p));
}

intent(
    `Where (is|are) (the|) $(N~ ${NATURE_INTENTS}) (incident|incidents|call|calls|)`,
    `Where (is|are) (the|) $(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident|incidents|call|calls|)`,
    `Where (is|are) (the|) $(N ${SINGLE_CODES}) (incident|incidents|call|calls|)`,
    `Where (is|are) (the|) $(C* ${DIGIT_CODES_PATTERN}) (incident|incidents|call|calls|)`,
    `Show $(N~ ${NATURE_INTENTS}) (incident|incidents|call|calls|) (location|locations)`,
    `Show $(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident|incidents|call|calls|) (location|locations)`,
    `Show $(N ${SINGLE_CODES}) (incident|incidents|call|calls|) (location|locations)`,
    `Show $(C* ${DIGIT_CODES_PATTERN}) (incident|incidents|call|calls|) (location|locations)`,
    p => {
        let natureCode;
        if (p.C && p.C.value) {
            natureCode = utils.digitCode(p.C.value);
        } else if (p.NP && p.NP.length) {
            natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
        } else if (p.N.label) {
            natureCode = p.N.label.toUpperCase();
        } else {
            natureCode = p.N.value;
        }
        playAttrByNature(p, natureCode, "location");
    }
);

intent(
    `When (was|were) (the|) $(N~ ${NATURE_INTENTS}) (incident|incidents|call|calls|) (opened|registered|)`,
    `When (was|were) (the|) $(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident|incidents|call|calls|) (opened|registered|)`,
    `When (was|were) (the|)$(N ${SINGLE_CODES}) (incident|incidents|call|calls|) (opened|registered|)`,
    `When (was|were) (the|) $(C* ${DIGIT_CODES_PATTERN}) (incident|incidents|call|calls|) (opened|registered|)`,
    p => {
        let natureCode;
        if (p.C && p.C.value) {
            natureCode = utils.digitCode(p.C.value);
        } else if (p.NP && p.NP.length) {
            natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
        } else if (p.N.label) {
            natureCode = p.N.label.toUpperCase();
        } else {
            natureCode = p.N.value;
        }
        playAttrByNature(p, natureCode, "time");
    }
);

intent(
    `(show|what is|what are) (the|) $(R nearest|closest|close|near|around) $(T unit_|car_)`,
    p => {
        let coords = utils.getCurrentCoordinates(p);
        let sort = (a, b) =>  utils.getDistanceLatLon(coords, a.location) - utils.getDistanceLatLon(coords, b.location);
        listUnits(p, "The " + p.R.value, p.T, sort);
    }
);

intent(
    "(list|show) all $(T units|cars|engines)",
    p => {
        let coords = utils.getCurrentCoordinates(p);
        let sort = (a, b) => utils.getDistanceLatLon(coords, a.location) - utils.getDistanceLatLon(coords, b.location);
        listUnits(p, "The nearest", p.T, sort);
    }
);


intent(
    "how many $(E incidents|calls|units)",
    p => {
        p.userData.snapshot.then(result => {
            let size = 0;
            if (p.E.value === "incidents" || p.E.value === "calls") {
                size = _.size(result.package.calls);
                clearFilters(p, Call);
            } else if (p.E.value === "units") {
                size = _.size(result.package.units);
                clearFilters(p, Unit);
            }
            if (size > 0) {
                p.play(`There are ${size} ${p.E}`);
            } else {
                p.play(`There are no ${p.E}`);
            }
        }).catch(errorHandler(p));
    }
);

intent(
    `what (is|are) $(A* ${CALL_ATTR_INTENTS}) of $(N~ ${NATURE_INTENTS}) (incident|incidents|call|calls|)`,
    `what (is|are) $(A* ${CALL_ATTR_INTENTS}) of $(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident|incidents|call|calls|)`,
    `what (is|are) $(A* ${CALL_ATTR_INTENTS}) of $(N ${SINGLE_CODES}) (incident|incidents|call|calls|)`,
    `what (is|are) $(A* ${CALL_ATTR_INTENTS}) of $(C* ${DIGIT_CODES_PATTERN}) (incident|incidents|call|calls|)`,
    `$(N~ ${NATURE_INTENTS}) (incident|incidents|call|calls|) $(A* ${CALL_ATTR_INTENTS})`,
    `$(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident|incidents|call|calls|) $(A* ${CALL_ATTR_INTENTS})`,
    `$(N ${SINGLE_CODES}) (incident|incidents|call|calls|) $(A* ${CALL_ATTR_INTENTS})`,
    `$(C* ${DIGIT_CODES_PATTERN}) (incident|incidents|call|calls|) $(A* ${CALL_ATTR_INTENTS})`,
    p => {
        let attr = CALL_ATTR_ALIASES[p.A.value.toLowerCase()];
        let natureCode;
        if (p.C && p.C.value) {
            natureCode = utils.digitCode(p.C.value);
        } else if (p.NP && p.NP.length) {
            natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
        } else if (p.N && p.N.label) {
            natureCode = p.N.label.toUpperCase()
        } else {
            natureCode = p.N.value;
        }
        playAttrByNature(p, natureCode, attr);
    }
);

// compound attributes of nature incidents
intent(
    `what (is|are) (the|) $(A* ${CALL_ATTR_INTENTS}) (and|) $(A* ${CALL_ATTR_INTENTS}) of (the|) $(N~ ${NATURE_INTENTS}) (incident|incidents|call|calls|)`,
    `what (is|are) (the|) $(A* ${CALL_ATTR_INTENTS}) (and|) $(A* ${CALL_ATTR_INTENTS}) of (the|) $(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident|incidents|call|calls|)`,
    `what (is|are) (the|) $(A* ${CALL_ATTR_INTENTS}) (and|) $(A* ${CALL_ATTR_INTENTS}) of (the|) $(N ${SINGLE_CODES}) (incident|incidents|call|calls|)`,
    `what (is|are) (the|) $(A* ${CALL_ATTR_INTENTS}) (and|) $(A* ${CALL_ATTR_INTENTS}) of (the|) $(C* ${DIGIT_CODES_PATTERN}) (incident|incidents|call|calls|)`,
    `$(N~ ${NATURE_INTENTS}) (incident|incidents|call|calls|) $(A* ${CALL_ATTR_INTENTS}) (and|) $(A* ${CALL_ATTR_INTENTS})`,
    `$(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident|incidents|call|calls|) $(A* ${CALL_ATTR_INTENTS}) (and|) $(A* ${CALL_ATTR_INTENTS})`,
    `$(N ${SINGLE_CODES}) (incident|incidents|call|calls|) $(A* ${CALL_ATTR_INTENTS}) (and|) $(A* ${CALL_ATTR_INTENTS})`,
    `$(C* ${DIGIT_CODES_PATTERN}) (incident|incidents|call|calls|) $(A* ${CALL_ATTR_INTENTS}) (and|) $(A* ${CALL_ATTR_INTENTS})`,
    p => {
        let attr = p.As.map(i => CALL_ATTR_ALIASES[i.value.toLowerCase()]);
        let natureCode;
        if (p.C && p.C.value) {
            natureCode = utils.digitCode(p.C.value);
        } else if (p.NP && p.NP.length) {
            natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
        } else if (p.N && p.N.label) {
            natureCode = p.N.label.toUpperCase()
        } else {
            natureCode = p.N.value;
        }
        play2AttrByNature(p, natureCode, attr);
    }
);

intent(
    `Get $(A* ${CALL_ATTR_INTENTS}) and directions to the $(N~ ${NATURE_INTENTS}) (incident_|call_|)`,
    `Get $(A* ${CALL_ATTR_INTENTS}) and directions to the $(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident_|call_|)`,
    `Get $(A* ${CALL_ATTR_INTENTS}) and directions to the $(N ${SINGLE_CODES}) (incident_|call_|)`,
    `Get $(A* ${CALL_ATTR_INTENTS}) and directions to the $(C* ${DIGIT_CODES_PATTERN}) (incident_|call_|)`,
    p => {
        let attr = CALL_ATTR_ALIASES[p.A.value.toLowerCase()];
        let natureCode;
        if (p.C && p.C.value) {
            natureCode = utils.digitCode(p.C.value);
        } else if (p.NP && p.NP.length) {
            natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
        } else if (p.N && p.N.label) {
            natureCode = p.N.label.toUpperCase()
        } else {
            natureCode = p.N.value;
        }
        p.userData.snapshot.then(result => {
            let config = CALL_ATTR[attr];
            if (attr === DETAILS || !config) {
                console.log(`Attribute ${attr} is not allowed here`);
                return;
            }
            let calls = result.package.calls.filter(c => c.nature === natureCode);
            if (_.isEmpty(calls)) {
                p.play(`${utils.getNature(natureCode)} incident is not found`);
                return;
            }
            const call = calls[0];
            p.play({
                "command": "navigate",
                "value": call.id.callNumber
            });
            p.play(`Getting directions to the ${utils.getNature(natureCode)} incident at ${utils.address(call.location.address)}` + (["location", "address"].includes(attr)? ``:`, ${attr} is ${config.value(call, true)}`));
        }).catch(errorHandler(p));
    }
);

intent(
    `Get directions to the highest priority (incident|call|)`,
    p => {
        p.userData.snapshot.then(result => {
            let calls = result.package.calls.sort((a, b) => parseInt(a.priority.code) - parseInt(b.priority.code));
            if (_.isEmpty(calls)) {
                p.play(`Incidents not found`);
                return;
            }
            const call = calls[0];
            p.play({
                "command": "navigate",
                "value": call.id.callNumber
            });
            p.play(`Getting directions to the ${utils.getNature(call.nature)} incident at ${utils.address(call.location.address)}, priority is ${call.priority.description}`);
        }).catch(errorHandler(p));
    }
);

intent(
    `(what is the|) $(A* ${CALL_ATTR_INTENTS}) of (the|) $(N~ ${NATURE_INTENTS}) (incident_|call_|) $(IN at|in) $(LOC)`,
    `(what is the|) $(A* ${CALL_ATTR_INTENTS}) of (the|) $(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident_|call_|) $(IN at|in) $(LOC)`,
    `$(N~ ${NATURE_INTENTS}) (incident_|call_|) $(IN at|in) $(LOC) $(A* ${CALL_ATTR_INTENTS})`,
    `$(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident_|call_|) $(IN at|in) $(LOC) $(A* ${CALL_ATTR_INTENTS})`,
    p => {
        let attr = CALL_ATTR_ALIASES[p.A.value.toLowerCase()];
        let natureCode;
        if (p.C && p.C.value) {
            natureCode = utils.digitCode(p.C.value);
        } else if (p.NP && p.NP.value) {
            natureCode = NATURE_NOT_FUZZY[p.NP.value.toLowerCase()];
        } else if (p.N && p.N.label) {
            natureCode = p.N.label.toUpperCase()
        } else {
            natureCode = p.N.value;
        }
        playAttrByNature(p, natureCode, attr, p.LOC, p.IN);
    }
);

intent(
    `When (was|were) the $(N~ ${NATURE_INTENTS}) (incident_|call_|) $(IN at|in) $(LOC) (opened|registered|)`,
    `When (was|were) the $(NP ${NATURE_NOT_FUZZY_INTENTS}) (incident_|call_|) $(IN at|in) $(LOC) (opened|registered|)`,
    p => {
        let natureCode;
        if (p.NP && p.NP.length) {
            natureCode = NATURE_NOT_FUZZY[p.NP.toLowerCase()];
        } else if (p.N && p.N.label) {
            natureCode = p.N.label.toUpperCase();
        } else {
            natureCode = p.N.value;
        }
        playAttrByNature(p, natureCode, "time", p.LOC, p.IN);
    }
);

intent(
    `When was (the status of|) $(U* ${UNIT_PATTERN}) updated`,
    `What time was (the status update of|) $(U* ${UNIT_PATTERN}) (updated|)`,
    `When was (the status of|) $(U ${UNIT_INTENT}) updated`,
    `What time was (the status update of|) $(U ${UNIT_INTENT}) (updated|)`,
    p => {
        p.userData.snapshot.then(async data => {
            const unitName = p.U.label ? p.U.label : p.U.value;
            if (!unitName) {
                p.play(`Can't find unit`);
                return;
            }
            const unitNumberArr = utils.unitNumberVariants(unitName);
            let unit = data.package.units.find(u => unitNumberArr.includes(u.id.unitNumber));
            if (!unit) {
                unit = await askSimilarUnit(p, unitName, data.package.units);
            }
            if (!unit) {
                return;
            }
            clearFilters(p, Unit);
            p.play({
                command: "showUnitsMap",
                value: [unit.id.unitNumber]
            });
            oneUnitFunctions.time(p, unit, data);
        }).catch(errorHandler(p));
    }
);



intent(
    `(what is|) $(ATTR ${UNIT_ATTR_INTENTS}) (of|) (unit|) $(U* ${UNIT_PATTERN})`,
    `$(U* ${UNIT_PATTERN}) $(ATTR ${UNIT_ATTR_INTENTS})`,
    `(what is|) $(ATTR ${UNIT_ATTR_INTENTS}) (of|) (unit|) $(U ${UNIT_INTENT})`,
    `$(U ${UNIT_INTENT}) $(ATTR ${UNIT_ATTR_INTENTS})`,
    p => {
        const unitName = p.U.label ? p.U.label : p.U.value;
        const attr = UNIT_ATTR_ALIASES[p.ATTR.toLowerCase()];
        if (!attr) {
            p.play(`Can't find attribute ${p.ATTR}`);
            return;
        }
        p.userData.snapshot.then(async data => {
            const unitNumberArr = utils.unitNumberVariants(unitName);
            let unit = data.package.units.find(u => unitNumberArr.includes(u.id.unitNumber));
            if (!unit) {
                unit = await askSimilarUnit(p, unitName, data.package.units);
            }
            if (!unit) {
                return;
            }
            clearFilters(p, Unit);
            p.play({
                command: "showUnitsMap",
                value: [unit.id.unitNumber]
            });
            oneUnitFunctions[attr](p, unit, data);
        });
    }
);

// browse snapshot atrributes collections
intent(
    `pluck $(U u|) $(S s|) $(D br|) $(R* (calls|units|interops)\\s+(.+))`,
    p => {
        p.userData.snapshot.then(result => {
            let args = p.R.value.split(/\s+/);
            let list = utils.pluck(result.package[args[0]], args.slice(-(args.length - 1)));
            if (p.U && p.U.value === "u") {
                list = _.uniq(list);
            }
            if(p.S && p.S.value === "s") {
                list = list.sort();
            }
            let delimiter = p.D && p.D.value === "br" ? "<br>" : ", ";
            p.play(list.join(delimiter));
        });
    }
);

// List incidents
function listCallsFilter(p, prefix, what, sort, filter, pattern) {
    p.userData.snapshot.then(result => {
        let calls = result.package.calls;
        if(_.isFunction(filter))
            calls = calls.filter(filter);
        if(_.isFunction(sort))
            calls = calls.sort(sort);
        if (!calls.length) {
            p.play(`There is no ${prefix} incidents at the moment`);
            return;
        }
        listCalls(p, prefix, what, calls, pattern);
    }).catch(errorHandler(p));
}

function listCalls(p, prefix, what, calls, pattern) {
    what = what.value ? what.value : what;
    if (!calls.length) {
        p.play(`There is no active ${what} at the moment`);
        return;
    }
    let plural = utils.isPlural(what, calls);
    if (!plural) {
        calls = [calls[0]];
        if(what.endsWith("s")) {
            what = what.substring(0, what.length-1);
        }
    }
    clearFilters(p, Call);
    listObjects(
        p,
        {
            items: calls,
            step: STEP_LIST,
            pattern: pattern ? pattern : (item) => [utils.getNature(item.nature), "at", utils.address(item.location.address)].join(" "),
            command: "showIncidentsMap",
            commandValue: (item) => item.id.callNumber,
            promt: `The ${prefix} ${what} ${plural ? "are" : "is"} `,
        }
    );
}

// List units
function listUnits(p, prefix, what, sort = null, filter = null) {
    p.userData.snapshot.then(result => {
        let units = result.package.units;
        if(_.isFunction(filter))
            units = units.filter(filter);
        if(_.isFunction(sort))
            units = units.sort(sort);
        if (!units.length) {
            p.play(`There are no ${prefix} units`);
            return;
        }
        if (!utils.isPlural(what, units)) {
            units = [units[0]];
        }
        if(units.length > STEP_LIST) {
            p.play(`There are ${units.length} units.`);
        }
        clearFilters(p, Unit);
        listObjects(p,
            {
                items: units,
                step: STEP_LIST,
                command: "showUnitsMap",
                pattern: (item) => item.id.description + (_.size(units) === 1 ? `. Its status is ${utils.unitStatus(item)}` : ``),
                commandValue: (item) => item.id.unitNumber,
                promt: `${prefix} ${utils.isPlural(what, units) ? (units.length > STEP_LIST ? "ones are" : "units are") : "unit is"} `,
            });
    }).catch(errorHandler(p));
}

// Show incidents by nature
function showIncidentsByNature(p, config) {
    p.userData.snapshot.then(result => {
        if (!config.natureCode) {
            p.play("This query requires nature code of incident");
            return;
        }
        let natureCode = config.natureCode.toUpperCase();
        let calls = result.package.calls.filter(c => c.nature === natureCode).sort(config.sortBy);
        if (!_.size(calls)) {
            p.play(`There are no incidents with ${utils.getNature(natureCode)} nature`);
            return;
        }
        if (!config.callString.endsWith("s") || _.size(calls) === 1) {
            calls = [calls[0]];
            if (config.callString.endsWith('s')) {
                config.callString = config.callString.slice(0, -1);
            }
        }
        let promt = [];
        if (_.size(calls) > 1) {
            promt.push(`There are ${_.size(calls)} ${utils.getNature(natureCode)} ${config.callString}.`);
        }
        promt.push(`The ${config.prefix} ${utils.getNature(natureCode)} ${config.callString} ${_.size(calls)>1 ? "are" : "is"} `);

        let params = {
            items: calls,
            step: STEP_LIST,
            pattern: config.pattern ? config.pattern : (item) => ["at", utils.address(item.location.address), _.isEmpty(item.location.city)? "": "in " + item.location.city,
                _.size(calls) > 1 ? "with status" : `, status of ${config.callString} is `, utils.unitStatus(item)].join(' '),
            command: "showIncidentsMap",
            commandValue: (item) => item.id.callNumber,
            promt: promt.join(' '),
        };
        clearFilters(p, Call);
        listObjects(p, params)
    }).catch(errorHandler(p));
}

// List objects
function listObjects(p, c, attr) {
    if (!c.items || _.isEmpty(c.items)) {
        p.play(c.nodata ? c.nodata : "List of objects is empty");
        return;
    }
    c.step = Math.min(c.step, c.items.length, STEP_LIST);
    let showItems = c.items.slice(0, c.step);
    if (c.command) {
        let value = _.isFunction(c.commandValue) ? _.map(showItems, i => c.commandValue(i)) : showItems;
        if (c.command === "showIncidentDetails" || c.command === "showUnitDetails") {
            value = value[0];
        }
        p.play({
            "command": c.command,
            "value": value
        });
    }

    if (_.size(showItems) === 1) {
        let item = showItems[0];
        p.play(utils.highlightCommand(item));
        let playValue = (c.promt ? c.promt : "") + " ";
        playValue +=  playFormat(c.pattern, item, attr);
        p.play(playValue);
        p.play(utils.highlightCommand(item, true));
        return;
    } else {
        if (c.promt) {
            p.play(c.promt);
        }
        playHightlighedItems(p, showItems, (i) => playFormat(c.pattern, i, attr));
        if (c.items.length > c.step) {
            p.play(`Do you want to hear more?`);
        }
    }
    let state = {
        items: c.items, from: c.step, step: c.step, command: c.command,
        pattern: c.pattern, commandValue: c.commandValue, attr: attr
    };
    p.then(repeatListItems, {state});
}

function clearFilters(p, filter) {
    if (filter === Call || filter === All) {
        p.play({
            command: "applyIncidentsFilter"
        });
    }
    if (filter === Unit || filter === All) {
        p.play({
            command: "applyUnitsFilter"
        });
    }
}

function clearSorting(p, sortType) {
    if (sortType === Call || sortType === All) {
        p.play({
            command: "applyIncidentsSort"
        });
    }
    if (sortType === Unit || sortType === All) {
        p.play({
            command: "applyUnitsSort"
        });
    }
}

//intent(
//    "nature codes",
//    p => {
//        utils.alanSafetyAPI(p.auth, "/api/v1/natures", (err, res) => {
//            if (err) {
//                console.log('Sorry, (could not|failed to) read the database (our service team is working on it) (, please, try again later|)');
//            } else {
//                p.play(res);
//            }
//        });
//    }
//);
