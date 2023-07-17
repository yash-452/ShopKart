

const stripe =require("stripe")('sk_test_51NSR1CSDc3Z3v1iDxoLoJ4zSeZOn2CdMstdjNVA7gHzvqU37yVkVFlwjmXp3tN41oO4Mb1dXcx3ZZYRBfV0RrCRr00n4edD5bC');

("use strict");

/**
 * order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController ('api::order.order', ({strapi})=>({
async create(ctx){
    const{products}=ctx.request.body;
    try{
    const lineItems=await Promise.all(
        products.map(async (product) =>{
        const item= await strapi
            .service("api::product.product")
            .findOne(product.id);

            return {
                price_data:{
                    currency:"usd",
                    product_data:{
                        name: item.title,
                    },
                    unit_amount:item.price*100
                },
                quantity:item.quantity
            };
        
        })
        
    );
    
        const session= await stripe.checkout.sessions.create({
            mode: 'payment',
    success_url: `${process.env.CLIENT_URL}?success=true`,
    cancel_url: `${process.env.CLIENT_URL}?success=false`,
    line_items:lineItems,
    shipping_address_collection:{allowed_countries:["IND","SL","BAN"]},
    payment_method_types:["card"],

        });

        await strapi.service("api::order:order").create({
            data:{
            products,
            stripeId: session.id,
        },
    });

    return {stripeSession: session};
    }catch(err){
        ctx.response.status=500;
        return err;
    }
},
}));
