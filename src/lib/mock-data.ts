import { v4 as uuidv4 } from 'uuid';

export const generateGuestMockTrip = (userId: string) => {
  const tripId = uuidv4();

  return {
    trip: {
      trip_uuid: tripId,
      user_id: userId,
      name: "My First Adventure ✈️",
      destination: "Tokyo",
      country_code: "JP",
      currency_code: "JPY",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      status: 'A'
    },
    day: [{
      trip_uuid: tripId,
      day_number: 1,
      title: "Arrival & Exploration",
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
    },
    {
      trip_uuid: tripId,
      day_number: 2,
      title: "Day 2",
      user_id: userId,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    }],
    activities: [
      {
        day_uuid: null,
        name: "Check-in to Hotel",
        time: "14:00:00",
        activity_type: "Accommodation",
        description: "Drop off luggage and freshen up.",
        address: "Tokyo Station Area",
        user_id: userId
      },
      {
        day_uuid: null,
        name: "Welcome Dinner",
        time: "19:00:00",
        activity_type: "Food",
        description: "Enjoy local ramen for the first night!",
        address: "Ichiran Ramen",
        user_id: userId
      }
    ],
    expenses: [
      {
        trip_uuid: tripId,
        name: "Accommodation",
        expense_category: "Household",
        amount: 1000,
        date: new Date().toISOString().split('T')[0],
        currency_code: "JPY",
        user_id: userId
      },
      {
        trip_uuid: tripId,
        name: "Welcome Dinner",
        expense_category: "Food",
        amount: 500,
        date: new Date().toISOString().split('T')[0],
        currency_code: "JPY",
        user_id: userId
      }
    ],
    shoppingList: [
      {
        trip_uuid: tripId,
        name: "Tokyo Station Area",
        shopping_category: "Essentials",
        price: 1000,
        store: "Tokyo Station Area",
        address: "Tokyo Station Area",
        user_id: userId,
        pcs: 1,
        checked:false
      },
      {
        trip_uuid: tripId,
        name: "Ichiran Ramen",
        shopping_category: "Food",
        price: 500,
        store: "Ichiran Ramen",
        address: "Ichiran Ramen",
        user_id: userId,
        pcs: 1,
        checked:false
      }
    ]
  };
};