import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";

import { ALL_ITEMS_QUERY } from "./Items";

const DELETE_ITEM_MUTATION = gql`
  mutation DELETE_ITEM_MUTATION($id: ID!) {
    deleteItem(id: $id) {
      id
    }
  }
`;

class DeleteItem extends Component {
  // apollo will give you the cache (check the apollo tools, it is all of the items stored in cache), and the payload (the data that has come back from the item that was deleted) 
  update = (cache, payload) => {
    // manually update the cache on the client so it matches the server
    // 1. read the cache for the items we want (need to use a gql query)
    const data = cache.readQuery({ query: ALL_ITEMS_QUERY })
    console.log(data)
    // 2. Filter the deleted item out of the cache
    data.items = data.items.filter(item => item.id !== payload.data.deleteItem.id)
    // put the items back in cache
    cache.writeQuery({ query: ALL_ITEMS_QUERY, data })
  }

  render() {
    return (
      <Mutation
        mutation={DELETE_ITEM_MUTATION}
        variables={{ id: this.props.id }}
        update={this.update}
      >
        {(deleteItem, { error }) => (
          <button onClick={() => {
            if (confirm("Are you sure you want to delete this item?")) {
              deleteItem().catch(err => {
                alert(err.message)
              })
            }
          }}>{this.props.children}</button>

        )}
      </Mutation>
    )
  }
}

export default DeleteItem;