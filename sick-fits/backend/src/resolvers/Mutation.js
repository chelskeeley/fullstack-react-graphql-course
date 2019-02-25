const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");

const Mutations = {
  async createItem(parents, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that.")
    }

    const item = await ctx.db.mutation.createItem({
      data: {
        user: {
          // this is how we create a relationship between the item and the user
          connect: {
            id: ctx.request.userId
          }
        },
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
  async signin(parent, { email, password }, ctx, info) {
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
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye!" }
  },
  async requestReset(parent, args, ctx, info) {
    // 1. Check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}.`);
    }
    // 2. Set a reset token and expiry
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // one hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    })

    // 3. Email them the reset token
    const mailRes = await transport.sendMail({
      from: "chelsea.keeley@gmail.com",
      to: user.email,
      subjectLine: "Your Password Reset Token",
      html: makeANiceEmail(`Your password token is here! \n\n <a href='${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}'>Click Here to Reset</a>`)
    })

    // 4. Return the message
    return { message: "Thanks" }
  },
  async resetPassword(parent, args, ctx, info) {
    // 1. Check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Your passwords do not match.")
    }
    // 2. Check if its a legit reset Token
    // 3. Check if its expired
    // the _gte here comes from us querying "users" instead of "user". Check in prisma.graphql, under type Query, when we query users, when have access to input UserWhereInput, and if you look at that input, it gives us access to all manner of logic that allows us to check, in this case, if the resetTokenExpiry is gte, or greater than or equal to, the current time minus one hour
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      }
    })
    if (!user) {
      throw new Error("This token is either invalid or expired.")
    }
    // 4. Hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save the new password to the user and remove old reset token fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    })
    // 6. generate jwt
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. Set jwt cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    })
    // 8. Return the new user
    return updatedUser;
  }
};

module.exports = Mutations;
