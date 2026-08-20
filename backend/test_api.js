async function test() {
  try {
    const res = await fetch('http://localhost:5001/api/chat/explain-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: "int main() { return 0; }" })
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

test();
