import { HuggingFaceChatbot } from "@/components/huggingface-chatbot";


export default function Home() {
  return (
    <div className="grid bg-gray-950  items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <HuggingFaceChatbot/>
    </div>
  );
}
