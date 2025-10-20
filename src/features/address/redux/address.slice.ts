import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type AddressState = {
  list: Address[];
  selectedId?: string;
};

const initialState: AddressState = {
  list: [
    {
      id: 'addr-1',
      fullName: 'Demo User',
      phone: '+91 90000 00000',
      line1: '221B Baker Street',
      city: 'Mumbai',
      state: 'MH',
      zip: '400001',
      country: 'India',
    },
  ],
  selectedId: 'addr-1',
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    addAddress: (state, action: PayloadAction<Address>) => {
      state.list.push(action.payload);
      state.selectedId = action.payload.id;
    },
    updateAddress: (state, action: PayloadAction<Address>) => {
      const idx = state.list.findIndex(a => a.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(a => a.id !== action.payload);
      if (state.selectedId === action.payload) {
        state.selectedId = state.list[0]?.id;
      }
    },
    selectAddress: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
  }
});

export const { addAddress, updateAddress, removeAddress, selectAddress } = addressSlice.actions;
export default addressSlice.reducer;
