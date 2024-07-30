const axios = require('axios');
const { createEvents } = require('ics');
const moment = require('moment-timezone');

exports.handler = async (event, context) => {
  try {
    const url = 'https://developers.events/all-events.json';
    const response = await axios.get(url);
    const events = response.data;

    // Filter events based on status and location
    const filteredEvents = events.filter(event => event.status === 'open' && event.location.toLowerCase() !== 'online');

    // Convert Unix ms timestamp to array format [YYYY, MM, DD, HH, mm, ss]
    const eventList = filteredEvents.map(event => {
      const start = moment(event.date[0]).tz('UTC').format('YYYY-M-D-H-m').split('-').map(Number);
      const end = event.date.length > 1 
        ? moment(event.date[1]).tz('UTC').format('YYYY-M-D-H-m').split('-').map(Number)
        : moment(event.date[0]).tz('UTC').add(1, 'day').format('YYYY-M-D-H-m').split('-').map(Number);

      return {
        title: event.name,
        start: start,
        end: end,
        location: event.location,
        description: event.misc || event.hyperlink || '',  // Use misc or hyperlink as description
      };
    });

    const { error, value } = createEvents(eventList);

    if (error) {
      console.log(error);
      return {
        statusCode: 500,
        body: 'Error generating iCalendar file',
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': 'attachment; filename="events.ics"',
      },
      body: value,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: 'Error fetching events data',
    };
  }
};
