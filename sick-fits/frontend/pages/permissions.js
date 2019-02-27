import React from 'react';

import PleaseSignIn from "../components/PleaseSignIn";
import Permissions from "../components/Permissions";

const permissions = props => (
  <div>
    <PleaseSignIn>
      <Permissions />
    </PleaseSignIn>
  </div>
);

export default permissions;