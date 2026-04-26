import { useState, useEffect } from 'react';

const quotes = [
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work. – Stephen King",
  "Action is the foundational key to all success. – Pablo Picasso",
  "You don't need to see the whole staircase, just take the first step. – Martin Luther King Jr.",
  "Productivity is being able to do things that you were never able to do before. – Franz Kafka",
  "The secret of getting ahead is getting started. – Mark Twain",
  "Small deeds done are better than great deeds planned. – Peter Marshall",
  "Focus on being productive instead of busy. – Tim Ferriss",
  "It always seems impossible until it's done. – Nelson Mandela",
];

export function QuoteGenerator() {
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="text-center p-6 bg-card/[0.02] border border-white/5 rounded-2xl italic text-white/60 mb-6">
      “{quote}”
    </div>
  );
}
