import * as functions from "firebase-functions";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

import { Client } from "@notionhq/client"


const { DATABASE_ID, NOTION_AUTH_KEY, SECRET } = process.env as { [index: string]: string };

export const getProjects = functions.https.onRequest(async (request, response) => {
    if (request.query.secret !== SECRET) {
        response.status(401).send("Unauthorized");
        return;
    }

    try {
        const notion = new Client({ auth: NOTION_AUTH_KEY })

        const db = await notion.databases.retrieve({ database_id: DATABASE_ID });

        const projects = (db.properties.Project as any).select.options.map((o: { name: string }) => o.name);

        response.send(projects);
    } catch (error) {
        console.error(error.body)
        response.status(500).send(error.body);
    }
});

export const openClockIns = functions.https.onRequest(async (request, response) => {
    if (request.query.secret !== SECRET) {
        response.status(401).send("Unauthorized");
        return;
    }

    try {
        const notion = new Client({ auth: NOTION_AUTH_KEY });

        const openClockIns = await getOpenClockIns(notion);

        response.send(`${openClockIns.length}`);

    } catch (error) {
        console.error(error.body)
        response.status(500).send(error.body);
    }

});

export const clockIn = functions.https.onRequest(async (request, response) => {
    if (request.query.secret !== SECRET) {
        response.status(401).send("Unauthorized");
        return;
    }

    try {
        const notion = new Client({ auth: NOTION_AUTH_KEY })

        const time = new Date();
        const project = request.query.project as string;

        if (!project) {
            response.status(400).send("?project=[project name] is required");
            return;
        }

        const latest = await getOpenClockIns(notion);

        if (latest.length === 1) {
            response.status(400).send("Error: You are already clocked in!");
            return;
        }

        if (latest.length === 1) {
            response.status(400).send("Error: Several clock ins detected. Check database!");
            return;
        }

        await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                "Time In": {
                    date: {
                        start: time.toISOString(),
                    }
                },
                Project: {
                    select: {
                        name: project
                    }
                },
            },
        })
        response.send("Success");
    } catch (error) {
        console.error(error.body)
        response.status(500).send(error.body);
    }
});

export const clockOut = functions.https.onRequest(async (request, response) => {
    if (request.query.secret !== SECRET) {
        response.status(401).send("Unauthorized");
        return;
    }

    try {
        const notion = new Client({ auth: NOTION_AUTH_KEY })

        const time = new Date();

        const latest = await getOpenClockIns(notion);

        if (latest.length === 0) {
            response.status(400).send("Nothing to clock out");
            return;
        }

        if (latest.length > 1) {
            response.status(400).send("Error: Multiple clock ins exist. Check database");
            return;
        }

        const page_id = latest[0].id

        await notion.pages.update({
            page_id,
            properties: {
                "Time Out": {
                    date: {
                        start: time.toISOString(),
                    }
                }
            }
        })
        response.send("Success");
    } catch (error) {
        console.error(error.body)
        response.status(500).send(error.body);
    }
});

async function getOpenClockIns(notion: Client) {
    const latest = await notion.databases.query({
        database_id: DATABASE_ID,
        filter: {
            property: "Time Out",
            date: {
                is_empty: true
            }
        },
        sorts: [
            {
                property: 'Time In',
                direction: 'descending',
            },
        ]
    });

    return latest.results;
}