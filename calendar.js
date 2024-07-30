const axios = require('axios');
const { createEvents } = require('ics');

exports.handler = async (event, context) => {
  try {
    const url = 'https://developers.events/all-events.json';
    const response = await axios.get(url);
    const events = response.data;

    const eventList = events.map(event => ({
      title: event.name,
      start: event.start_date.split('-').map(Number),
      end: event.end_date.split('-').map(Number),
      location: event.location,
      description: event.description,
    }));

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

