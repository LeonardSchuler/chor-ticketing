import "./style.css";

import "./components/SeatsMap.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Select Your Seats</h1>
    <seats-map></seats-map>
    <div id="selected-seats" class="mt-6 p-4 bg-gray-50 rounded-lg min-h-[100px]"></div>
    <button id="confirm-booking" class="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
      Confirm Booking
    </button>
  </div>
`;

//setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);

//import { initPWA } from "./pwa.ts";
//initPWA(app);
