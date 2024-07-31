const axios = require('axios');
const { createEvents } = require('ics');
const moment = require('moment-timezone');

exports.handler = async (event, context) => {
  try {
    const url = 'https://developers.events/all-cfps.json';
    const response = await axios.get(url);
    const cfpEvents = response.data;

    // Filter CFP events where today is less than the untilDate and location is not 'Online'
    const filteredCfpEvents = cfpEvents.filter(cfp => {
      const today = moment().tz('UTC');
      const untilDate = moment(cfp.untilDate).tz('UTC');
      return today.isBefore(untilDate) && cfp.conf.location.toLowerCase() !== 'online';
    });

    // Convert Unix ms timestamp to array format [YYYY, MM, DD, HH, mm, ss]
    const eventList = filteredCfpEvents.map(cfp => {
      const start = moment(cfp.conf.date[0]).tz('UTC').format('YYYY-M-D').split('-').map(Number);
      const end = cfp.conf.date.length > 1 
        ? moment(cfp.conf.date[1]).tz('UTC').add(1, 'day').format('YYYY-M-D').split('-').map(Number)
        : moment(cfp.conf.date[0]).tz('UTC').add(1, 'day').format('YYYY-M-D').split('-').map(Number); // Add 1 day to end for all-day event

      return {
        title: `${cfp.conf.name} CFP Deadline`,
        start: start,
        end: end,
        location: cfp.conf.location,
        description: cfp.link || cfp.conf.hyperlink || '',  // Use CFP link or conference hyperlink as description
        allDay: true  // Mark as an all-day event
      };
    });

    const { error, value } = createEvents(eventList.map(event => ({
      ...event,
      start: { date: event.start },
      end: { date: event.end },
    })));

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
        'Content-Disposition': 'attachment; filename="cfp-deadlines.ics"',
      },
      body: value,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: 'Error fetching CFP data',
    };
  }
};
