const axios = require('axios');
const { createEvents } = require('ics');
const moment = require('moment');

exports.handler = async (event, context) => {
  try {
    const url = 'https://developers.events/all-events.json';
    const response = await axios.get(url);
    const events = response.data;

    // Filter events based on status and location
    const filteredEvents = events.filter(event => event.status === 'open' && event.location.toLowerCase() !== 'online');

    // Convert Unix ms timestamp to array format [YYYY, MM, DD, HH, mm, ss]
    const eventList = filteredEvents.map(event => ({
      title: event.name,
      start: moment(event.start_date).format('YYYY-M-D-H-m').split('-').map(Number),
      end: moment(event.end_date).format('YYYY-M-D-H-m').split('-').map(Number),
      location: event.location,
      cfp: event.cfp,
    }));

    const { error, value } = createEvents(eventList);

    if (error) {
      console.log(error);
      return {
        statusCode: 500,
        body: 'Error generating iCalendar file'+error,
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
