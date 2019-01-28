const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
  },

  async signup(parent, args, ctx, info) {
    // lowercase their email
    args.email = args.email.toLowerCase();
    // hash their password for security, using a one-way hash packaging called bcrypt
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the db
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ["USER"] }
      }
    }, info);
    // create JWT for the user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the jwt as a cookie on the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    })
    // fiiinally we return the new user to the browser
    return user;
  },
  async signin(parent, { email, password}, ctx, info) {
    // 1. Check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });

    if (!user) {
      throw new Error(`No user found for email: ${email}`)
    }

    // 2. Check that the password is correct
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new Error("Invalid Password!")
    }
    // 3. Generate the JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    })
    // 5. Return the user
    return user;
  }
};

module.exports = Mutations;
