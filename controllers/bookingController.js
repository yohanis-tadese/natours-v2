const Stripe = require('stripe');
const Tour = require('../models/tourModel');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = async (req, res, next) => {
  try {
    // 1. Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2. Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get(
        'host'
      )}/my-tours?alert=booking`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            },
            unit_amount: tour.price * 100, // Price in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
    });

    // 3. Send it to the client
    res.status(200).json({
      status: 'success',
      session,
    });
  } catch (error) {
    next(error);
  }
};
