const Mutations = {
  async createItem(parents, args, ctx, info) {
    // TODO: check if they are logged in

    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
      }
    }, info)

    return item
  },

  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the ID from the update, we don't want to update the ID
    delete updates.id
    // run the update method. ctx is the context in the request, db is how we expose the prisma database to ourselves, then we have either the query or mutation, then we have access to all the methods that are part of either the query or mutation in the generated prisma.graphql file
    return ctx.db.mutation.updateItem({
      data: updates,
      where: {
        id: args.id
      }
    }, info);
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id }
    // find the item
    const item = await ctx.db.query.item({ where }, `{id title}`)
    // check if they own that item, or have permissions
    // TODO
    // delete it
    return ctx.db.mutation.deleteItem({ where }, info)
  }
};

module.exports = Mutations;
