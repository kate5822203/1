// {Name: Alan_Safety_3_Utils}
// {Description: Alan Safety utils functions}
// {Visibility: Admin}

function reportGA(p) {
    let jsp = {
        url: "https://alan-nginx/api_playground/report_alan_safety",
        strictSSL: false,
        method: 'POST',
        timeout: 3000,
        json: { alanSafetyUsername: p.auth.tellusUsername,
            alanSafetyBaseUrl:  p.auth.tellusBaseUrl,
            alanSafetyDeviceId: p.auth.tellusDeviceId,
            alanSafetyScript:   "Alan_Safety",
            key: "deb9528d4dd75498a4bc98c33199436b"
        }
    };

//    api.request(jsp, (err, res, body) => {
//        if (err) {
//            console.log(err);
//            return;
//        }
//    });
}

function aliases(a, f) {
    let s = {};
    a.forEach(i => {
        if (Array.isArray(i))
            i.forEach(j => {
                if (_.isFunction(f) && j === i[0]) {
                    let fr = f(j);
                    if (fr) {
                        s[fr] = j;
                    }
                } else {
                    s[j] = i[0];
                }
            });
        else
            s[_.isFunction(f) ? f(i) : i] = i;
    });
    return s;
}

function getCachedSnapshot(p, callback) {
    const tellusTimeout = 10000;
    let req = {
        url: "https://alan-nginx/api_playground/tellus_snapshot_cache",
        strictSSL: false,
        method: 'POST',
        timeout: tellusTimeout + 2000,
        json: {
            "url": `${p.auth.tellusBaseUrl}/api/v1/snapshot?` +
                `deviceId=${p.auth.tellusDeviceId}` +
                `&authenticationToken=${p.auth.tellusAuthenticationToken}`,
            "timeoutMs": tellusTimeout,
            "expireTimeS": 24 * 60 * 60,
            "baseUrl": p.auth.tellusBaseUrl,
            "username": p.auth.tellusUsername,
            "key": "deb9528d4dd75498a4bc98c33199436b"
        }
    };
    api.request(req, (err, res, body) => {
        if (err) {
            console.log('err: ' + err);
            callback(err);
            return;
        }
        try {
            if (body.status != 200) {
                console.log("getCachedSnapshot: status: " + body.status);
                callback("cannot-connect");
                return;
            }
            const tellusJson = JSON.parse(body.body);
            if (tellusJson.error) {
                const errorStr = _.isString(tellusJson.error.description) ?
                    tellusJson.error.description :
                    JSON.stringify(tellusJson.error);
                console.log("getCachedSnapshot: error response: " + errorStr);
                if ("Not Authorized" == errorStr) {
                    callback("not-authorized");
                }
                callback(errorStr);
                return;
            }
            body.snapshot = JSON.parse(body.body);
            callback(null, body);
        } catch (e) {
            callback(e);
        }
    }).catch(e => console.error("error in getCachedSnapshot " + e));
}

function findAssignedIncidents(data, unitNumber) {
    return _(data.package.interops)
        .map('calls')
        .flatten()
        .filter(c => c.assignedUnits && c.assignedUnits.find(u => u.unitNumber == unitNumber))
        .map(ac => data.package.calls.find(c => c.id.callNumber == ac.id.callNumber))
        .filter(Boolean)
        .value();
}

function findAssignedUnits(data, callNumber) {
    return _(data.package.interops)
        .map('calls')
        .flatten()
        .filter(c => c.assignedUnits && c.id.callNumber == callNumber)
        .map(c => c.assignedUnits)
        .flatten()
        .map(au => data.package.units.find(u => u.id.unitNumber == au.unitNumber))
        .filter(Boolean)
        .value();
}

function findUnitByUnitNumber(data, unitNumber) {
    return data.package.units
        .find(u => unitNumber.toUpperCase() === u.id.unitNumber.toUpperCase());
}

function findCallByCallNumber(data, callNumber) {
    return data.package.calls
        .find(c => callNumber.toUpperCase() === c.id.callNumber.toUpperCase());
}

function callStatus(call) {
    return call.responseState.slice(4);
}

function unitStatus(unit) {
    return unit.responseState.slice(4);
}

function highlightCommand(item, removeHighlight = false) {
    return command(item, {call: "highlightIncident", unit: "highlightUnit", removeHighlight});
}

function detailsCommand(item) {
    return command(item, {call: "showUnitDetails", unit: "showUnitDetails"});
}

function command(item, c) {
    const {Type} = project.enums;
    let itemType = getItemType(item);
    if (itemType === Type.CALL) {
        return {
            "command": c.call,
            "value": c.removeHighlight? "": item.id.callNumber
        };
    } else if (itemType === Type.UNIT) {
        return {
            "command": c.unit,
            "value": c.removeHighlight? "": item.id.unitNumber
        };
    }
}

function alanSafetyAPI(auth, method, callback) {
    let user = "deviceId=" + auth.tellusDeviceId;
    let token = "authenticationToken=" + auth.tellusAuthenticationToken;
    let url = auth.tellusBaseUrl;
    const URL = `${url}${method}?${user}&${token}`;
    const options = {
        timeout: 20000,
        rejectUnauthorized: false,
        ecdhCurve: 'auto'
    };
    api.request.get(URL, options, (error, res, body) => {
        if (error) {
            callback(error);
            return;
        }
        try {
            callback(null, JSON.parse(body));
        } catch (e) {
            callback(e);
        }
    });
}

function getDistanceLatLon(p1, p2) {
    return getDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
}

function getDistance(latitude1, longitude1, latitude2, longitude2) {
    let earthRadius = 6371; // Radius of the earth in km
    let dLat = deg2rad(latitude2 - latitude1);
    let dLon = deg2rad(longitude2 - longitude1);
    let a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(latitude1)) * Math.cos(deg2rad(latitude2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = earthRadius * c;
    //let miles = d / 1.609344;
    return d;
}

function deg2rad(degrees) {
    return degrees * Math.PI / 180;
}

function getCurrentCoordinates(p) {
    return {"latitude": 40.55, "longitude": -111.90}
}

function spacify(item) {
    return item.split('').join(' ');
}

function isPlural(item, list) {
    let value = item.value? item.value : item;
    return value.endsWith("s") && _.size(list) > 1;
}

function joinAnd(list) {
    let head = list.slice(0, -1);
    return _.isEmpty(head) ? list[0] : head.join(", ") + ", and " + list.slice(-1);
}

function pluck(list, ...attr) {
    return _.map(list, item => {
        let a = _.flatten(attr);
        for (let i in a) {
            if (item) {
                item = item[a[i]]
            }
        }
        return item;
    });
}

function getNature(code) {
    let natureCode = code.toUpperCase();
    let natureDescription = project.NATURE_CODES[natureCode];
    return _.isEmpty(natureDescription) ? spacify(natureCode) : natureDescription[0];
}

function getItemType(item) {
    const {Type} = project.enums;
    if (item.responseState.startsWith("Unit")) {
        return Type.UNIT
    } else if (item.responseState.startsWith("Call")) {
        return Type.CALL
    }
}

function getTime(time) {
    let datetime = new Date(time);
    let format =  (datetime.getDay() === new Date().getDay())? "h:mm A": "h:mm A of MMMM Do";
    return api.moment(time).format(format);
}

function unitQuery(p, params, callback) {
    tellusPOST(p, "/api/v1/unitQuery", params, (body) => {
        callback(body);
    })
}

function callQuery(p, params, callback) {
    tellusPOST(p, "/api/v1/callQuery", params, (body) => {
        callback(body)
    })
}

function addressShortcuts(addr) {
    let shortcuts = {
        Apt:  "Apartment",
        Ave:  "Avenue",
        Bldg: "Building",
        Blvd: "Boulevard",
        Dr:   "Drive",
        Ln:   "Lane",
        Pkwy: "Parkway",
        PI:   "Place",
        Rd:   "Road",
        Rte:  "Route",
        St:   "Street",
        Tpke: "Turnpike",
        Hwy:  "Highway",
        Ct:   "Court",
        Bch:  "Beach",
        Btm:  "Bottom",
        Br:   "Branch",
        Brg:  "Bridge",
        Brk:  "Brook",
        Byp:  "Bypass",
        Cp:   "Camp",
        Cyn:  "Canyon",
        Ctr:  "Center",
        Cir:  "Circle",
        Cl:   "Club",
        Cmn:  "Common",
        Cor:  "Corner",
        Cv:   "Cove",
        Crk:  "Creek",
        Cres: "Crescent",
        Xing: "Crossing",
        Xrd:  "Crossroad",
        Curv: "Curve",
        Dv:   "Divide",
        Est:  "Estate",
        Expy: "Expressway",
        Ext:  "Extension",
        Fry:  "Ferry",
        Fld:  "Field",
        Flt:  "Flat",
        Frd:  "Ford",
        Frst: "Forest",
        Frg:  "Forge",
        Frk:  "Fork",
        Ft:   "Fort",
        Hl:   "Hill",
        Holw: "Hollow",
        Gdn:  "Garden",
        Gtwy: "Gateway",
        Gln:  "Glen",
        Hbr:  "Harbor",
        Hvn:  "Haven",
        Hts:  "Heights",
        Is:   "Island",
        Jct:  "Junction",
        Lk:   "Lake",
        Lck:  "Lock",
        Mdw:  "Meadow",
        MTWY: "Motorway",
        Mt:   "Mount",
        Mnt:  "Mountain",
        Orch: "Orchard",
        Psge: "Passage",
        Pl:   "Place",
        Plz:  "Plaza",
        Pt:   "Point",
        Prt:  "Port",
        Rnch: "Ranch",
        Rpd:  "Rapid",
        Riv:  "River",
        Skwy: "Skyway",
        Spg:  "Spring",
        Sq:   "Square",
        Sta:  "Station",
        Strm: "Stream",
        Smt:  "Summit",
        Ter:  "Terrace",
        Trwy: "Throughway",
        Trce: "Trace",
        Trak: "Track",
        Trfy: "Trafficway",
        Tunl: "Tunnel",
        Un:   "Union",
        Vly:  "Valley",
        Via:  "Viaduct",
        Vw:   "View",
        Vlg:  "Village",
        Wl:   "Well"
    };

    let keys = Object.keys(shortcuts);
    for(let key in keys) {
        let regex = new RegExp(`(^|\\W)(${keys[key]})(\\W|$)`,"gi");
        addr = addr.replace(regex, `$1${shortcuts[keys[key]]}$3`);
    }
    return addr;
}

function address(addr) {
    if(addr === undefined) {
        return "not defined address";
    }
    const digit = d => d === '0' ? 'oh': d;

    let directions = {
        'W': 'West',
        'E': 'East',
        'S': 'South',
        'N': 'North',
        'NE': 'Northeast',
        'NW': 'Northwest',
        'SE': 'Southeast',
        'SW': 'Southwest'
    };

    let dirsMatch = addr.match(/(^|\W)[NSWE]{1,2}(\W|$)/g);
    if (dirsMatch) {
        let dirs = dirsMatch.map(a => a.replace(/ /g, ''));
        for (let i = 0; i < dirs.length; i++) {
            addr = addr.replace(dirs[i], directions[dirs[i]]);
        }
    }
    addr = addressShortcuts(addr);

    let numMatch = addr.match(/\d+\W/g);
    if (!numMatch) {
        return addr;
    }
    let numbers = numMatch.map(a => a.replace(/ /g, ''));
    for (let number of numbers) {
        let split = number.split('');
        let reverse = [...split].reverse();
        let zeros = 0;
        let total = split.length;
        for (let i = 0; i < total; i++) {
            if (reverse[i] === '0') {
                zeros++;
                continue;
            }
            break;
        }
        let replacemet;
        if (zeros === total - 1) {
            // say as is
            continue;
        } else if (total === 4 && zeros === 2) {
            replacemet = `${number.substring(0, 2)} hundred`;
        } else if (total === 3) {
            if (split[1] === '0') {
                replacemet = split.map(a => digit(a)).join(', ');
            } else {
                replacemet = digit(split[0]) + ", " + number.substring(1);
            }
        } else if (total === 4 && split[1] === '0' && split[2] === '0') {
            replacemet = split.map(a => digit(a)).join(', ');
        } else {
            replacemet = number.substring(0, 2) + ", " + number.substring(2)
        }
        if (replacemet) {
            addr = addr.replace(number, replacemet + ", ");
        }
    }
    return addr;
}

function callNumber(str) {
    let number = str.replace(/[\s\-]/g, '');
    let digits = number.match(/\d+$/g)[0];
    let first = number.split(digits)[0];
    let a = digits.split('');
    let second = "";
    for(let i = 0; i < a.length; i++) {
        if (i % 2 === 0) second += " ";
        second += a[i];
    }
    return first.split('').join(' ') + second;
}

function comments(value) {
    if (_.isEmpty(value)) return "";
    return value.replace(/\d{4,}/g, function (str) {
            return spacify(str);
        }
    );
}

const numbers = {
    zero: 0,
    oh: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100
};

function digitCode(value) {
    let words = value.split(/\s/).filter(s => !_.isEmpty(s) && s !== "and");
    let prefix, code = 0, code_str = "", hundred = false;
    prefix = parseInt(words[0]) || numbers[words[0]];
    words.slice(1).forEach(n => {
        let number = parseInt(n) || numbers[n];
        if (number === 100) {
            hundred = true;
            code_str += !_.isEmpty(code_str) ? "00" : number;
        } else {
            if (hundred) {
                code_str = parseInt(code_str) + number + "";
            }else
                code_str += number;
        }
    });
    return prefix + "-" + parseInt(code_str);
}

function tellusPOST(p, method, params, callback) {
    params.request = {
        deviceId: p.auth.tellusDeviceId,
        authenticationToken: p.auth.tellusAuthenticationToken
    };
    let jsp = {
        url: p.auth.tellusBaseUrl + method,
        strictSSL: false,
        method: 'POST',
        json: params,
        timeout: 20000
    };
    api.request(jsp, (error, res, body) => {
        if (error) {
            p.play("Tellus API call failed: " + error);
        }
        callback(body);
    });
}

const commonAddressParts = ["road",
    "lane",
    "drive",
    "street",
    "circle",
    "avenue",
    "court",
    "place",
    "terrace",
    "boulevard",
    "highway",
    "way",
    "loop",
    "lake",
    "square",
    "park",
    "parkway",
    "alley"];

function findCallsByAddr(calls, address) {
    calls = calls.filter(c => c && c.location);
    const cities = _.chain(calls)
        .filter(c => c.location.city)
        .map(c => c.location.city.toLowerCase())
        .uniq()
        .value();
    const addrLower = address.toLowerCase();
    const foundCity = cities
        .filter(c => addrLower.includes(c))
        .sort((a, b) => b.length - a.length)[0];
    const addrWithoutCity = foundCity ? addrLower.replace(foundCity, "") : addrLower;
    const cleanAddrArr = addrWithoutCity
        .split(/[^\w]/)
        .filter(Boolean)
        .filter(w => !commonAddressParts.includes(w));
    const callsInCity = foundCity ?
        calls.filter(c => c.location.city && c.location.city.toLowerCase() == foundCity) :
        calls;
    const haveAddress = cleanAddrArr.length;
    if (!haveAddress) {
        return callsInCity;
    }
    const results = _.chain(callsInCity)
        .filter(c => c.location.address)
        .map(c => {
            return {
                call: c,
                addr: c.location.address.toLowerCase(),
                res: 0
            }
        })
        .forEach(o => o.res = cleanAddrArr.map(w => o.addr.includes(w)).filter(Boolean).length)
        .filter(o => o.res)
        .sort((a, b) => b - a)
        .value();
    if (!results.length) {
        return [];
    }
    const bestResult = results[0].res;
    return results.filter(o => o.res == bestResult).map(o => o.call);
}

function unitNumberVariants(unitNumberStr) {
    let str = unitNumberStr.toUpperCase();
    str = str.replace(/AMBULANCE/,"A");
    str = str.replace(/BATTALION CHIEF/,"BC");
    str = str.replace(/ENGINE/,"E");
    str = str.replace(/PARAMEDIC/,"EMS");
    str = str.replace(/LADDER/,"L");
    str = str.replace(/SERGEANT/,"S");
    str = str.replace(/SEARCH AND RESCUE|SEARCH & RESCUE/,"SR");

    str = str.replace(/ZERO/g, "0");
    str = str.replace(/TRIPLE (\d)/g,"$1$1$1");
    str = str.replace(/DOUBLE (\d)/g,"$1$1");

    let unitNumber = str.split(/\s+/)
        .map(v => numbers[v.toLowerCase()] !== undefined ? numbers[v.toLowerCase()] : v)
        .join('')
        .toUpperCase();
    unitNumber = unitNumber.replace(/O/g, "0");
    let letters = unitNumber.match(/([A-Z]+)/)[0];
    let digits = unitNumber.match(/\d+/)[0];
    let number = parseInt(digits);
    let n = letters.length > 1 ? 2 : 3;
    let numLen = number.toString().length;
    let zeros = "";
    if(n - numLen === 1) {
        zeros = "0";
    } else
    if(n - numLen === 2) {
        zeros = "00";
    }
    return [letters + zeros + number];
}

function getDeployment(p) {
    const curUrl = p.auth.tellusBaseUrl;
    const deploys = project.deployments;
    for (let name in project.deployments) {
        if (curUrl.includes(deploys[name])) {
            return name;
        }
    }
}

function levenshteinDistance(s, t) {
    if (s.length === 0) return t.length;
    if (t.length === 0) return s.length;

    return Math.min(
        levenshteinDistance(s.substr(1), t) + 1,
        levenshteinDistance(t.substr(1), s) + 1,
        levenshteinDistance(s.substr(1), t.substr(1)) + (s[0] !== t[0] ? 1 : 0)
    );
}

function getAliases(p, aliases) {
    const label = '~' + p;
    const synonymIntents = _(Object.keys(aliases))
        .filter(a => p.includes(a)) // only aliases that are included in this name
        .map(a => aliases[a]
             .map(r => p.replace(a, r) + label))
        .flatten()
        .value();
    return [p + label].concat(synonymIntents);
}

project.utils = {
    reportGA,
    aliases,
    findAssignedIncidents,
    findUnitByUnitNumber,
    findCallByCallNumber,
    callStatus,
    unitStatus,
    highlightCommand,
    detailsCommand,
    findAssignedUnits,
    alanSafetyAPI: alanSafetyAPI,
    getDistanceLatLon,
    getCurrentCoordinates,
    spacify,
    isPlural,
    joinAnd,
    pluck,
    getNature,
    getTime,
    address,
    comments,
    digitCode,
    findCallsByAddr,
    unitNumberVariants,
    callNumber,
    getDeployment,
    getCachedSnapshot,
    getItemType,
    levenshteinDistance,
    getAliases
};
