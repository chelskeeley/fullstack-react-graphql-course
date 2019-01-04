import React from 'react';
import Link from 'next/link';

import UpdateItem from "../components/UpdateItem";

// the query is available on props because we expose it in _app.js
const Sell = ({ query }) => (
  <div>
    <UpdateItem id={query.id} />
  </div>
);

export default Sell;