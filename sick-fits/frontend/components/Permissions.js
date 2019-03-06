import React, { Component } from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import PropTypes from "prop-types";

import Error from "./ErrorMessage";
import Table from "./styles/Table";
import SickButton from "./styles/SickButton";

const ALL_USERS_QUERY = gql`
  query {
    users {
      id
      name
      email
      permissions
    }
  }
`;

const UPDATE_PERMISSIONS_MUTATION = gql`
  mutation updatePermissions($permissions: [Permission], $userId: ID!) {
    updatePermissions(permissions: $permissions, userId: $userId) {
      id
      permissions
      name
      email
    }
  }
`;

const possiblePermissions = [
  "ADMIN",
  "USER",
  "ITEMCREATE",
  "ITEMUPDATE",
  "ITEMDELETE",
  "PERMISSIONUPDATE"
];

const Permissions = props => {
  return (
    <Query query={ALL_USERS_QUERY}>
      {({ data, loading, error }) => (
        <div>
          <Error error={error} />
          <div>
            <h2>Manage Premissions</h2>
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {possiblePermissions.map(permission => <th key={permission}>{permission}</th>)}
                  <th>Update...?</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(user => <UserPermissions user={user} key={user.email} />)}
              </tbody>
            </Table>
          </div>
        </div>
      )}

    </Query>
  )
};

class UserPermissions extends Component {
  static propTypes = {
    user: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      id: PropTypes.string,
      permissions: PropTypes.array,
    }).isRequired
  }

  // typically we do not want to initialize state with props. In this use case, we are seeding the data, so the initial user data will come from the props saved in state, and any changes will be changed in the LOCAL state, then when we save, the changed data will be sent to the BE
  state = {
    permissions: this.props.user.permissions,
  }

  handlePermissionChange = (e) => {
    const checkbox = e.target;
    // take a copy of the current permissions
    let updatedPermissions = [...this.state.permissions];

    if (checkbox.checked) {
      updatedPermissions.push(checkbox.value);
    } else {
      updatedPermissions = updatedPermissions.filter(permission => permission !== checkbox.value);
    }

    // if we passed the the updatePermissions function to this handler to call every time we check a checkbox, then we could pass it as a callback to setState, to ensure that state has been updated BEFORE we send the mutation to the BE with data from state!
    this.setState({
      permissions: updatedPermissions
    })
  }

  render() {
    const user = this.props.user;

    return (
      <Mutation mutation={UPDATE_PERMISSIONS_MUTATION} variables={{
        permissions: this.state.permissions,
        userId: user.id
      }}>
        {(updatePermissions, { loading, error }) => (
          <>
            {error && <tr><td colSpan="8"><Error error={error} /></td></tr>}
            <tr>
              <td>{user.name}</td>
              <td>{user.email}</td>
              {possiblePermissions.map(permission => (
                <td key={`${permission}-permission-${permission}`}>
                  <label htmlFor={`${permission}-permission-${permission}`}>
                    <input
                      type="checkbox"
                      checked={this.state.permissions.includes(permission)}
                      value={permission}
                      onChange={this.handlePermissionChange}
                      id={`${permission}-permission-${permission}`}
                    />
                  </label>
                </td>
              ))}
              <td>
                {/* could pass the updatePermissions function from Mutation to the onClick handler, and trigger the mutation to the BE whenever you click a checkbo */}
                <SickButton type="button" disabled={loading} onClick={updatePermissions}>
                  Updat{loading ? "ing" : "e"}
                </SickButton>
              </td>
            </tr>
          </>
        )}
      </Mutation>
    )
  }
}

export default Permissions;
