"use client";

import TiptapEditor from "@/components/content/TiptapEditor";
import React, { useState } from "react";

export default function Page() {
  const [value, setValue] = useState("<p>Hello <strong>world</strong></p>");

  return (
    <div>
      <h2>Compose</h2>
      <TiptapEditor
     
      />
      <h3>Output HTML</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>{value}</pre>
    </div>
  );
}
