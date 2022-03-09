// {Name: CRM}
// {Description: Gives basic CRM commands and responses for account opportunities. Shows a visual of corresponding opportunity details and news.}
// {Visibility: synqq.com, alan.app}

const COMPANIES = ['Bird', 'Starbucks', 'Microsoft', 'Postmates', 'Wag', 'Apple'].join('|');
const STATUSES = {
    0:   ["Closed Lost"],
    10:  ["Prospecting"],
    20:  ["Qualification"],
    30:  ["Needs Analysis"],
    40:  ["Value Proposition"],
    50:  ["Decision Makers"],
    60:  ["Proposal","Price Quote","Proposal Price Quote"],
    70:  ["Negotiation","Review","Negotiation Review"],
    100: ["Closed Won"]
};

const STATUS_LIST = _.flatten(_.map(STATUSES, (v,k)=> v.map(i => `${i}~${k}`))).join('|');

function response(p, type, json_data) {
    p.play({
        type: type,
        data: json_data,
        embeddedPage:true,
        command:"showSfState",
        page:"salesforce.html"
    });
}

function apiCall(p, command, param, callback) {
    let jsp = {
        url: "https://studio.alan.app/api_playground/" + command,
        strictSSL: false,
        method: 'POST',
        json: param,
        timeout: 3000,
    };
    api.request(jsp, (err, res, body)=> {
        if (err || res.statusCode !== 200) {
            p.play('(Sorry|) something went wrong (on the server|)');
        } else if (body.error) {
            p.play(body.error);
        } else {
            callback(body);
        }
    });
}


intent("What are (the|) (latest|new|) opportunities for my team?", p => {
    apiCall(p, 'sfdc_activities', {}, (body) => {
        let data = JSON.parse(body.data);
        response(p, "opportunities", data);

        p.play(`Your team has ${data.opp_number} new opportunities. (The most recent|Recent ones) are: `);

        let names = data.opp_recent.map(function (el) {
            response(p, "opportunities_sync", el);
            p.play(`${el.name}`);
        });
        response(p, "opportunities_sync", null);
    });
});

let opportunity = context(()=> {
    follow("what $(O company|opportunity) (are we talking about|)",
        p => {
            p.play(`it's ${p.state.company}`, `the ${p.O} is ${p.state.company}`);
        });

    follow("$(V increase|change|decrease|update|set) (it|size|revenue|) (to|) $(NUMBER)",
        p => {
            apiCall(p, 'sfdc_change_revenue', {company: p.state.company, amount: p.NUMBER.number}, (body)=> {
                response(p, "opportunity", JSON.parse(body.data));
                p.play(`(Ok|) changed (it|) to $${p.NUMBER.number}`);
            });
        });

    follow("what is the $(T size|revenue|revenue status)",
        p => {
            apiCall(p, 'sfdc_status', {company: p.state.company}, (body)=> {
                let data = JSON.parse(body.data);
                response(p, "opportunity", data);
                p.play(`(The|) (opportunity|) ${p.T} for ${p.state.company} is $${data.revenue}`);
            });
        });

    follow("what is the $(S status|stage|state)",
        p => {
            apiCall(p, 'sfdc_status', {company: p.state.company}, (body)=> {
                let data = JSON.parse(body.data);
                data.highlight = "status";
                response(p, "opportunity", data);
                p.play(`The ${p.S} of the ${p.state.company} opportunity is ${data.status}`);
            });
        });

    follow(`$(V change|update|set|move) (opportunity|) (status|stage|) to $(O~ ${STATUS_LIST})`,
        p => {
            let param = {company: p.state.company,  opportunity: p.O.value, probability: parseInt(p.O.label) };
            apiCall(p, 'sfdc_change_opportunity', param, (body)=> {
                let data = JSON.parse(body.data);
                response(p, "opportunity", data);
                p.play(`(The|) ${p.state.company} (opportunity|) status (has been|was) (changed|set) to ${p.O.value}`);
            });
        });

    follow(`(What are|read|show) (the|) (latest|recent|) (news|headlines) (about|on|) (the|) (company|opportunity|)`,
        p => {
            apiCall(p, 'sfdc_status', {company: p.state.company}, (body) => {
                let data = JSON.parse(body.data);
                if (data.news && data.news.length > 0) {
                    data.current = data.news[0];
                    data.index = 0;
                    response(p, "news", data);
                    p.play(`The recent news on ${p.state.company}: ${data.current.title}`);
                    data.news.shift();
                    let titles =  data.news.map(function (el,ind) {
                        var syncNewsData= data;
                        syncNewsData.current = el;
                        syncNewsData.index = ind + 1;
                        response(p, "news_sync", syncNewsData);
                        p.play(`${el.title}`);
                    });
                } else {
                    p.play(`There are no news for ${p.state.company}`);
                }
            });
        });
});

/**
 * Working with opportunity
 */
title('Salesforce Opportunity');

intent(`What ('s|is) (the|) $(S stage|status) of (the|) $(COMP ${COMPANIES}) (opportunity|)`,
    p => {
        apiCall(p, 'sfdc_status', {company: p.COMP.value}, (body)=> {
            var data = JSON.parse(body.data);
            data.highlight = "status";
            response(p, "opportunity", data);
            p.play(`The ${p.S} of the ${p.COMP} opportunity is ${data.status}`);
        });
        p.then(opportunity, {state: {company: p.COMP.value} });
    });

intent(`$(V change|update|set) the $(COMP ${COMPANIES}) (opportunity|) $(S status|stage|state) to $(O~ ${STATUS_LIST})`,
    p => {
        let param = {company: p.COMP.value, opportunity: p.O.value, probability: parseInt(p.O.label) };
        apiCall(p, 'sfdc_change_opportunity', param, (body)=> {
            var data = JSON.parse(body.data);
            response(p, "opportunity", data);
            p.play(`(The|) ${p.COMP} (opportunity|) ${p.S} (has been|was) changed to ${p.O.value}`);
        });
        p.then(opportunity, {state: {company: p.COMP.value} });
    });

intent(`$(V increase|change|decrease|update|set) $(COMP ${COMPANIES}) opportunity (size|revenue) (to|) $(NUMBER)`,
    p => {
        apiCall(p, 'sfdc_change_revenue', {company: p.COMP.value, amount: p.NUMBER.number}, (body)=> {
            response(p, "opportunity", JSON.parse(body.data));
            p.play(`(Ok|) changed (it|) to $${p.NUMBER.value}`);
        });
        p.then(opportunity, {state: {company: p.COMP.value} });
    });

intent(`What is the $(T size|revenue|revenue status|status) of my (opportunity at|) $(COMP ${COMPANIES}) (opportunity|)`,
    `What is (the|) $(COMP ${COMPANIES}) $(T size|revenue|revenue status)`,
    p => {
        apiCall(p, 'sfdc_status', {company: p.COMP.value}, (body)=> {
            var data = JSON.parse(body.data);
            response(p, "opportunity", data);
            p.play(`(Your|The|) opportunity ${p.T} for ${p.COMP} `,
                `The ${p.T} of the ${p.COMP} opportunity `);
            response(p, "opportunity_sync", {name: "revenue"});
            p.play(` is $${data.revenue}`);
            response(p, "opportunity_sync", null);
        });
        p.then(opportunity, {state: {company: p.COMP.value} });
    });

let whatCompany = context(()=> {
    follow(`(it's|for|company|opportunity|) $(COMP ${COMPANIES})`,
        p => {
            p.resolve(p.COMP.value);
        });
    follow(`(I|) don't know`, `(what|list) (companies|opportunities)`,
        p => {
            p.play('It can be Bird, Microsoft, Starbucks or other');
        });

    follow("What is $(NAME) role",
        p => {
            apiCall(p, 'sfdc_role', {company: p.state.company}, (body) => {
                p.play(`${body.contact.name}'s role `);
                response(p, "contacts_sync", {name: body.contact.role});
                p.play(`is ${body.contact.role}`);
                response(p, "contacts_sync", null);
            });
        });
});

intent(`What are the contacts at $(COMP ${COMPANIES})?`,
    `What are the $(COMP ${COMPANIES}) contacts?`,
    p => {
        apiCall(p, 'sfdc_status', {company: p.COMP.value}, (body)=> {
            var data = JSON.parse(body.data);
            response(p, "contacts", data);
            p.play(`The contacts at ${p.COMP.value} are `);
            data.contacts.forEach(el => {
                response(p, "contacts_sync", el);
                p.play(`${el.name}`);
            });
            response(p, "contacts_sync", null);
        });
        p.then(opportunity, {state: {company: p.COMP.value} });
        p.then(whatCompany, {state: {company: p.COMP.value} });
    });

intent("what is the (opportunity|) $(T size|revenue|revenue status)",
    async p => {
        p.play(`${p.T} for what (opportunity|company)?`);
        let company = await p.then(whatCompany);
        apiCall(p, 'sfdc_status', {company: company}, (body) => {
            let data = JSON.parse(body.data);
            response(p, "opportunity", data);
            p.play(`(The|) (opportunity|) ${p.T} for ${company} is $${data.revenue}`);
        });
        p.then(opportunity, {state: {company: company} });
    });

intent("what is the (opportunity|) $(T status|stage|state)",
    async p => {
        p.play(`The ${p.T} for what (opportunity|company)?`);
        let company = await p.then(whatCompany);
        apiCall(p, 'sfdc_status', {company: company}, (body) => {
            let data = JSON.parse(body.data);
            response(p, "opportunity", data);
            p.play(`(The|) (opportunity|) ${p.T} for ${company} is ${data.status}`);
        });
        p.then(opportunity, {state: {company: company} });
    });

intent(`What are (the|) (latest|) news (about|on|) (the|) $(COMP ${COMPANIES})?`,
    p => {
        apiCall(p, 'sfdc_status', {company: p.COMP.value}, (body) => {
            let data = JSON.parse(body.data);
            if (data.news && data.news.length > 0) {
                data.current = data.news[0];
                data.index = 0;
                response(p, "news", data);
                p.play(`The recent news on ${p.COMP.value}: ${data.current.title}`);
                data.news.shift();
                let titles =  data.news.map(function (el,ind) {
                    var syncNewsData= data;
                    syncNewsData.current = el;
                    syncNewsData.index = ind + 1;
                    response(p, "news_sync", syncNewsData);
                    p.play(`${el.title}`);
                });
            } else {
                p.play(`There are no news for ${p.COMP.value}`);
            }
        });
        p.then(opportunity, {state: {company: p.COMP.value} });
    });

intent(`What are $(COMP ${COMPANIES}) notes?`,
    p => {
        apiCall(p, 'sfdc_status', {company: p.COMP.value}, (body) => {
            let data = JSON.parse(body.data);

            if (data.notes && data.notes.length > 0) {
                response(p, "notes", data);
                p.play(`The notes from ${p.COMP.value} are: `);

                let notes = data.notes.map(function (el) {
                    p.play(`${el.date}`);
                    for (var i = 0; i < el.items.length; i++) {
                        response(p, "notes_sync", {name: el.items[i]});
                        p.play(`${ el.items[i]}`);
                    }
                });
                response(p, "notes_sync", null);
            } else {
                p.play(`There are no notes for ${p.COMP.value}`);
            }
        });
        p.then(opportunity, {state: {company: p.COMP.value} });
    });

intent(`(What are|Any|Tell me|Give me) (my|the|) (Salesforce|) $(ACT activities|opportunities|deals) (today|)`,
    p => {
        apiCall(p, 'sfdc_activities', {}, (body) => {
            let data = JSON.parse(body.data);
            response(p, "activities", data);

            p.play(`You have ${data.activities.length} ${p.ACT} today with `);

            let names = data.activities.map(function (el) {
                response(p, "activities_sync", el);
                p.play(`${el.name}`);
            });
            response(p, "activities_sync", null);
        });
    });

intent(`What does this app do?`, `How does this work?`, `What can I do here?`,
    reply(`This is a Salesforce project, and you can get the latest data on account opportunities.` +
        ` Just ask me any question about the revenue or sales of the companies${COMPANIES.replace(/\|/g, ', ')}` +
        `, and I will try to answer it.`));

intent(`What companies can I ask about?`, `What companies do you have data on?`,
    reply(`You can get Salesforce data on the (companies|corporations) ${COMPANIES.replace(/\|/g, ', ')}.`));
