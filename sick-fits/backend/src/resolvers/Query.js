const { hasPermission } = require("../utils");

const { forwardTo } = require("prisma-binding");

const Query = {
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  me(parent, args, ctx, info) {
    // check if there is a current user ID
    if (!ctx.request.userId) {
      return null;
    }

    return ctx.db.query.user({
      where: { id: ctx.request.userId }
    }, info)
  },
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();

  //   return items;
  // },
  async users(parent, args, ctx, info) {
    // 1. check if they are logged in 
    if (!ctx.request.userId) {
      throw new Error("You must be logged in.")
    }
    // 2. Check if the user has permissions to query all the users
    hasPermission(ctx.request.user, ["ADMIN", "PERMISSIONUPDATE"])
    // 3. If they do, query all the users
    // we are passing an empty where object, because we want all the info, and the info contains the query for the users from the front end
    return ctx.db.query.users({}, info);
  }
};

module.exports = Query;
