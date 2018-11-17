// this is where we import the graphql-yoga server
const { GraphQLServer } = require("graphql-yoga");
const Mutation = require("./resolvers/Mutation");
const Query = require("./resolvers/Query");
const db = require("./db");

// we are sort of creating two graphql servers, we have the prisma server, which needs its own typedefs and schema, and also a graphql server, which also needs its own typedefs and schema

// create graphql yoga server
function createServer() {
  return new GraphQLServer({
    typeDefs: "src/schema.graphql",
    resolvers: {
      Mutation,
      Query,
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    context: req => ({...req, db}),
  })
}

module.exports = createServer;