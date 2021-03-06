// wrapper for Google BigQuery
'use strict';

let gcloud = require('gcloud');

class BigQuery {
  constructor() {
    if ( ! process.env.GCP_PROJECT_ID ) { return false; }
    this._ = gcloud.bigquery({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: {
        private_key_id: process.env.GCP_PRIVATE_KEY_ID,
        private_key:    process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email:   process.env.GCP_CLIENT_EMAIL,
        client_id:      process.env.GCP_CLIENT_ID,
        type:           process.env.GCP_TYPE,
      },
    });
  }

  enable() {
    return !! this._;
  }

  query() {
    if ( ! this.enable() ) { return false; }
    return this._.query.apply(this._, arguments);
  }
}

module.exports = BigQuery;
