module.exports = {
  log: async(ctx) =>{
    //Our logic

    //Send cluster health
    let data = await strapi.services.websocket.log(ctx.request.body);


    ctx.send({
      message: data
    });
  },
  health: async(ctx) =>{
    //Our logic

    //Send cluster health
    let data = await strapi.services.websocket.health();


    ctx.send({
      message: data
    });
  }
}
