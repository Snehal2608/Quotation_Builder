import React from "react";

function CoolCard({ title, children }) {
  return (
    <div className="flex justify-center px-6 py-10">
      <div
        className="w-full max-w-lg p-8 transition-all duration-300 bg-white border border-teal-100 shadow-xl rounded-2xl hover:shadow-teal-500/40 hover:-translate-y-1"
      >
        <h2
          className="pb-3 mb-5 text-3xl font-extrabold tracking-wide text-teal-900 border-b border-teal-100"
        >
          {title}
        </h2>

        <p className="leading-relaxed text-teal-600">
          {children}
        </p>

        <button
          className="
            mt-7
            px-6 py-2.5
            font-semibold
            text-white
            bg-teal-500
            rounded-xl
            shadow-md
            transition-all duration-200
            hover:bg-teal-600
            hover:shadow-lg
            active:scale-[0.97]
          "
        >
          Learn More
        </button>
      </div>
    </div>
  );
}

export default CoolCard;
