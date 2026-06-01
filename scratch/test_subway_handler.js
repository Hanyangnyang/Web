import handler from '../api/subway.js';

const req = {
  method: 'GET',
  query: { full: 'false' }
};

const res = {
  setHeader: (k, v) => console.log(`Header: ${k} = ${v}`),
  status: (code) => {
    console.log(`Status: ${code}`);
    return {
      json: (data) => console.log('Response JSON:', JSON.stringify(data, null, 2).substring(0, 1000) + '... (truncated)'),
      end: () => console.log('Response End')
    };
  }
};

(async () => {
  await handler(req, res);
})();
