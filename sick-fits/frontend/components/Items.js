import React, { Component } from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import styled from "styled-components";

import Item from "./Item";
import Pagination from "./Pagination";
import { perPage } from "../config";

const ALL_ITEMS_QUERY = gql`
  query ALL_ITEMS_QUERY($skip: Int = 0, $first: Int = ${perPage}) {
    items(first: $first, skip: $skip, orderBy: createdAt_DESC) {
      id
      title
      price
      description
      image
      largeImage
    }
  }
`;

const Center = styled.div`
  text-align: center;
`;

const ItemsList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 60px;
  max-width: ${props => props.theme.maxWidth};
  margin: 0 auto;
`;

export default class Items extends Component {
  render() {
    return (
      <Center>
        <Pagination page={this.props.page}/>
        <Query
          query={ALL_ITEMS_QUERY}
          variables={{
          skip: this.props.page * perPage - perPage
          }}
          // Currently when we add or delete an item, the items page is pulling from the cache instead of refetching the queries, so you cannot see a new item added right away, and deleting an item messes up the pagination. The commented out line below tells the query to hit the network EVERY time we change a page, but this is not ideal as it takes away the current fast/snappy behaviour of using the cache with pagination. No current better solution through apollo, onward ho!
          // fetchPolicy="network-only"
        >
          {({ data, error, loading }) => {
            if (loading) return <p>Loading...</p>
            if (error) return <p>Error: {error.message}</p>
            return <ItemsList>
              {data.items.map(item => <Item item={item} key={item.id}/>)}
            </ItemsList>
          }}
        </Query>
        <Pagination page={this.props.page}/>
      </Center>
    )
  }
};

export { ALL_ITEMS_QUERY };