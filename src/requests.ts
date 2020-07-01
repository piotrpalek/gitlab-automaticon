import axios from 'axios';

function handleError(error: any) {
  console.log('ERROR OCCURED');
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message);
  }
  console.log(error.config);
}

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

export function fetchFromGitlab(url: string, params: any = {}) {
  const gitlabToken = process.env.GITLAB_TOKEN;

  return axios
    .get(url, {
      headers: {
        'Private-Token': gitlabToken,
      },
      params: {
        ...params,
      },
    })
    .then((response) => response.data)
    .catch(handleError);
}

export function createGitlab(url: string, data: any = {}) {
  const gitlabToken = process.env.GITLAB_TOKEN;
  const config = {
    headers: {
      'Private-Token': gitlabToken,
    },
  };

  return axios
    .post(url, data, config)
    .then((response) => response.data)
    .catch(handleError);
}

export function updateGitlab(url: string, data: any = {}) {
  const gitlabToken = process.env.GITLAB_TOKEN;
  const config = {
    headers: {
      'Private-Token': gitlabToken,
    },
  };

  return axios
    .put(url, data, config)
    .then((response) => response.data)
    .catch(handleError);
}

export function fetchFromTp(url: string, params: any = {}) {
  const tpToken = process.env.TP_TOKEN;

  return axios
    .get(url, {
      params: {
        access_token: tpToken,
        ...params,
      },
    })
    .then((response) => response.data)
    .catch(handleError);
}
