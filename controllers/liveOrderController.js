import LiveOrder from '../models/LiveOrder.js';
import { getCategoryMapping } from '../utils/menuUtils.js';
import membershipCard from '../models/Renewal.js';
import transactionModel from '../models/transactionModel.js';
// Get all live orders

const transaction = async (cardId, amount) => {
  try {

    let card = await membershipCard.findById(cardId);
    if (card) {
      card.creditLimit = card.creditLimit - amount;
      await card.save()
      await transactionModel.create({ amount, type: "dr", category: card?.membershipName, description: "Membership Cart payment", user: card.membershipId });
    }

  } catch (error) {
    console.log(error);

  }
}

export const getLiveOrders = async (req, res) => {
  try {
    const orders = await LiveOrder.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live orders', error: err });
  }
};

// Create a new live order
// export const createLiveOrder = async (req, res) => {
//   try {
//     const { table, items, card, userId, cardId, total, carddiscount } = req.body;

//     const categoryMapping = await getCategoryMapping();

//     const foodItems = items.filter(
//       item => categoryMapping[item.name] === 'veg' || categoryMapping[item.name] === 'non-veg'
//     );
//     const alcoholItems = items.filter(item => categoryMapping[item.name] !== 'veg' && categoryMapping[item.name] !== 'non-veg');

//     if (foodItems.length > 0) {
//       let foodtotal = foodItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
//       const foodOrder = new LiveOrder({
//         table,
//         items: foodItems,
//         category: "resturant",
//         total: foodtotal - (foodtotal * carddiscount / 100),
//         card, discount: (foodtotal * carddiscount / 100), cardId, userId

//       });
//       await foodOrder.save();
//     }

//     if (alcoholItems.length > 0) {
//       let alcoholprice = alcoholItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
//       const alcoholOrder = new LiveOrder({
//         table,
//         items: alcoholItems,
//         category: "bar",
//         total: alcoholprice - (alcoholprice * carddiscount / 100),
//         card, discount: (alcoholprice * carddiscount / 100), cardId, userId
//       });
//       await alcoholOrder.save();
//     }
//     if (cardId && total) {
//       transaction(cardId, total,)
//     }
//     res.status(201).json({ message: 'Orders created successfully' });
//   } catch (err) {
//     console.error('Error creating live orders:', err);
//     res.status(500).json({ message: 'Failed to create live orders', error: err });
//   }
// };

export const createLiveOrder = async (req, res) => {
  try {
    const { table, items, card, userId, cardId, total, carddiscount } = req.body;

    // Ensure discount is a valid number
    // const discountRate = Number(carddiscount);
    const discountRate = !isNaN(Number(carddiscount)) ? Number(carddiscount) : 0;

    if (isNaN(discountRate)) {
      return res.status(400).json({ message: "Invalid card discount value" });
    }

    // Get the category mapping
    const categoryMapping = await getCategoryMapping();

    // Separate food and alcohol items
    const foodItems = items.filter(
      item =>
        categoryMapping[item.name] === 'veg' ||
        categoryMapping[item.name] === 'non-veg'
    );
    const alcoholItems = items.filter(
      item =>
        categoryMapping[item.name] !== 'veg' &&
        categoryMapping[item.name] !== 'non-veg'
    );

    // Create food order
    if (foodItems.length > 0) {
      const foodTotal = foodItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const foodDiscount = (foodTotal * discountRate) / 100;
      const foodOrder = new LiveOrder({
        table,
        items: foodItems,
        category: 'resturant',
        total: Number((foodTotal - foodDiscount).toFixed(2)),
        card,
        discount: Number(foodDiscount.toFixed(2)),
        cardId,
        userId,
      });
      await foodOrder.save();
    }

    // Create alcohol order
    if (alcoholItems.length > 0) {
      const alcoholTotal = alcoholItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const alcoholDiscount = (alcoholTotal * discountRate) / 100;
      const alcoholOrder = new LiveOrder({
        table,
        items: alcoholItems,
        category: 'bar',
        total: Number((alcoholTotal - alcoholDiscount).toFixed(2)),
        card,
        discount: Number(alcoholDiscount.toFixed(2)),
        cardId,
        userId,
      });
      await alcoholOrder.save();
    }

    // Optional: call transaction
    if (cardId && total && !isNaN(Number(total))) {
      transaction(cardId, Number(total));
    }

    res.status(201).json({ message: 'Orders created successfully' });
  } catch (err) {
    console.error('Error creating live orders:', err);
    res.status(500).json({ message: 'Failed to create live orders', error: err });
  }
};

export const updateLiveOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await LiveOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update live order status', error: err });
  }
};

export const getAllLiveorderbycat = async (req, res) => {
  try {
    let cat = req.params.cat;
    let data = await LiveOrder.find({ category: cat }).sort({ _id: -1 }).populate("userId");
    return res.status(200).json({ success: data });
  } catch (error) {
    console.log(error);

  }
}

export const Liveorderbycat = async (req, res) => {
  try {
    let cat = req.params.cat;
    
    // Fetch orders where category matches AND status is NOT "Completed" OR "Cancelled"
    let data = await LiveOrder.find({ 
      category: cat, 
      status: { $nin: ["Served", "Cancelled"] } // Excludes "Completed" & "Cancelled" orders
    })
    .sort({ _id: -1 })
    .populate("userId");

    return res.status(200).json({ success: data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getAllOrderByUserId=async(req,res)=>{
  try {
    let id =req.params.id;
    let data=await LiveOrder.find({userId:id}).sort({_id:-1});
    return res.status(200).json({success:data});
  } catch (error) {
    console.log(error);
  }
}

export const makechangeStatusOrders=async(req,res)=>{
  try {
    let {id,status}=req.body;
    if(!id) return res.status(400).json({error:"Id is required"});
    if(!status) return res.status(400).json({error:"Status is required"});
    let data= await LiveOrder.findById(id);
    if(!data) return res.status(400).json({error:"Data not found"});
    data.status=status;
   await data.save()
    return res.status(200).json({success:"Successfully updated"})
  } catch (error) {
    console.log(error);
    
  }
}

// Move live order to history orders
export const moveOrderToHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await LiveOrder.findById(id);

    // Save to history orders
    const historyOrder = new HistoryOrder({ ...order.toObject() });
    await historyOrder.save();

    // Remove from live orders
    await LiveOrder.findByIdAndDelete(id);

    res.status(200).json({ message: 'Order moved to history' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to move order to history', error: err });
  }
};

// Delete a live order
export const deleteLiveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await LiveOrder.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Live order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete live order', error: err });
  }
};
