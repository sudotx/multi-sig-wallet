import React, { useState } from "react";

function NewTransfer({ createTransfer }) {
  const [transfer, setTransfer] = useState(undefined); //? react hooks

  const Submit = (e) => {
    e.preventDefault();
    createTransfer(transfer); //this passes a new transfer into create transfer
  };

  const updateTransfer = (e, field) => {
    const value = e.target.value; //this is the current value in the updateTransfer field
    setTransfer({ ...transfer, [field]: value }); //? react hooks
  }; //this function updates the current value of transfer

  return (
    <div>
      <h2>Create Transfer</h2>
      <form
        onSubmit={(e) => {
          Submit(e); //call function on submit
        }}
      >
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="text"
          onChange={(e) => updateTransfer(e, "amount")}
        />
        <label htmlFor="to">To</label>
        <input id="to" type="text" onChange={(e) => updateTransfer(e, "to")} />
        <button>Submit</button>
      </form>
    </div>
  );
}

export default NewTransfer;
