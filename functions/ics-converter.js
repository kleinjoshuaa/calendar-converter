const axios = require('axios');
const ical = require('ical');
const { createEvents } = require('ics');

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
      return {
        uid: event.uid,
        start: [event.start.getUTCFullYear(), event.start.getUTCMonth() + 1, event.start.getUTCDate()],
        end: [event.end.getUTCFullYear(), event.end.getUTCMonth() + 1, event.end.getUTCDate()],
        title: event.summary,
        location: event.location,
        description: event.description,
        url: event.url
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
