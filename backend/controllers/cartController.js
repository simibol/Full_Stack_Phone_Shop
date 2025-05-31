const Order = require('../models/Order');
const Phone = require('../models/Phone');

exports.checkout = async (req, res) => {
  try {
    const { cart, user } = req.body;

    if (!cart) {
      return res.status(400).json({ message: 'Cart is required.' });
    }

    const items = [];
    let total = 0;

    for (const [phoneId, quantity] of Object.entries(cart)) {
      const phone = await Phone.findById(phoneId);
      if (!phone) {
        return res.status(404).json({ message: `Phone not found: ${phoneId}` });
      }

      items.push({
        phone: phone._id,
        quantity,
        price: phone.price,
      });

      total += phone.price * quantity;
    }

    const order = new Order({
      buyer: user.id,
      items,
      total,
    });

    await order.save();
    console.log('Order created:', order);
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};
