import React from 'react';
import Reset from "../components/Reset";

const reset = props => (
  <div>
    <p>Reset Your Password {props.query.resetToken}</p>
    <Reset resetToken={props.query.resetToken} />
  </div>
);

export default reset;