import axios from 'axios';

import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51IgGbnHh9siSimrGfYm8C6MWh0bfX8OuS0XxIB53p7Jg4rLtCm30fr5u5T8iFlZOfS6eglxjn6z6aVi1AqSlW82D00URi8jQo5'
);

export const bookTour = async (tourId) => {
  try {
    // 1) get checkout session from API
    const session = await axios(
      'http://127.0.0.1:3000/api/v1/bookings/checkout-session/' + tourId
    );
    console.log(session);
    // 2) Create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
