const axios = require('axios');
const ical = require('ical');
const { createEvents } = require('ics');
const moment = require('moment-timezone');

exports.handler = async (event, context) => {
  try {
    const url = 'https://api.callingallpapers.com/v1/cfp?type=calendar';
    const response = await axios.get(url);

    // Parse the ICS file
    const parsedData = ical.parseICS(response.data);

    // Filter events based on location
    const filteredEvents = Object.values(parsedData).filter(event => {
      return event.type === 'VEVENT' && (!event.location || !event.location.toLowerCase().includes('online'));
    });

    // Convert filtered events to the format required by ics library
    const eventList = filteredEvents.map(event => {
      const start = [
        event.start.getUTCFullYear(),
        event.start.getUTCMonth() + 1,
        event.start.getUTCDate(),
        event.start.getUTCHours(),
        event.start.getUTCMinutes()
      ];
      const end = [
        event.end.getUTCFullYear(),
        event.end.getUTCMonth() + 1,
        event.end.getUTCDate(),
        event.end.getUTCHours(),
        event.end.getUTCMinutes()
      ];

      return {
        uid: event.uid,
        start: start,
        end: end,
        title: event.summary,
        location: event.location,
        description: event.description,
        url: typeof event.url === 'object' ? event.url.val : event.url  // Ensure url is a string
      };
    });

    // Generate the new ICS file
    const { error, value } = createEvents(eventList);

    if (error) {
      console.log(error);
      return {
        statusCode: 500,
        body: 'Error generating filtered iCalendar file',
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': 'attachment; filename="filtered-events.ics"',
      },
      body: value,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: 'Error fetching or processing iCalendar data',
    };
  }
};
