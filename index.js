bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id;
  let user = await User.findOne({ telegramId }); // ✅ Valid
  
  if (!user) {
    user = await User.create({
      telegramId,
      username: ctx.from.username,
      firstName: ctx.from.first_name
    });
  }

  await ctx.reply(`Welcome ${ctx.from.first_name} to CryptoPulse! 🚀`);
});
