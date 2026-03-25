(() => {
  "use strict";

  const displayEl = document.getElementById("calc-display");
  const themeToggleEl = document.getElementById("theme-toggle");
  const keysEl = document.querySelector(".calculator__keys");
  const keys = keysEl ? Array.from(keysEl.querySelectorAll("button[data-action]")) : [];

  const state = {
    // What the user is currently typing.
    currentInput: "0",
    // Tokenized expression (evaluated only when '=' is pressed).
    nums: [],
    ops: [],
    // If true, the next digit/decimal replaces currentInput instead of appending.
    expectingNumber: false,
    error: false,
    errorMessage: null,
    // Required fields (derived from the token list).
    firstOperand: null,
    operator: null,
    secondOperand: null,
  };

  function setDisplay(value) {
    if (!displayEl) return;
    displayEl.textContent = value;
  }

  function setError(message) {
    state.error = true;
    state.errorMessage = message;
    setDisplay(message);
  }

  function operatorSymbol(op) {
    switch (op) {
      case "+":
        return "+";
      case "-":
        return "−";
      case "*":
        return "×";
      case "/":
        return "÷";
      default:
        return op;
    }
  }

  function renderDisplay() {
    if (state.error) {
      setDisplay(state.errorMessage || "Error");
      return;
    }

    if (state.ops.length === 0) {
      setDisplay(state.currentInput);
      return;
    }

    let expr = "";
    for (let i = 0; i < state.ops.length; i++) {
      const n = state.nums[i];
      expr += n === undefined ? "?" : String(n);
      expr += ` ${operatorSymbol(state.ops[i])} `;
    }

    if (!state.expectingNumber) {
      expr += state.currentInput;
    } else {
      expr = expr.trimEnd();
    }

    setDisplay(expr);
  }

  function throwSyntaxError() {
    throw new Error("Syntax Error");
  }

  function resetAll() {
    state.currentInput = "0";
    state.nums = [];
    state.ops = [];
    state.expectingNumber = false;
    state.error = false;
    state.errorMessage = null;
    state.firstOperand = null;
    state.operator = null;
    state.secondOperand = null;
    renderDisplay();
  }

  function formatResult(n) {
    if (!Number.isFinite(n)) return "Error";
    const rounded = Number.parseFloat(n.toFixed(12));
    if (Object.is(rounded, -0)) return "0";
    return String(rounded);
  }

  function add(a, b) {
    return a + b;
  }

  function subtract(a, b) {
    return a - b;
  }

  function multiply(a, b) {
    return a * b;
  }

  function divide(a, b) {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
  }

  function operate(a, op, b) {
    switch (op) {
      case "+":
        return add(a, b);
      case "-":
        return subtract(a, b);
      case "*":
        return multiply(a, b);
      case "/":
        return divide(a, b);
      default:
        throw new Error("Unknown operator");
    }
  }

  function evaluateExpression(nums, ops) {
    const numbers = nums.slice();
    const operators = ops.slice();

    // Handle * and / first (left-to-right).
    for (let i = 0; i < operators.length; ) {
      const op = operators[i];
      if (op === "*" || op === "/") {
        const res = operate(numbers[i], op, numbers[i + 1]);
        numbers.splice(i, 2, res);
        operators.splice(i, 1);
      } else {
        i++;
      }
    }

    // Then handle + and - (left-to-right).
    let result = numbers[0];
    for (let i = 0; i < operators.length; i++) {
      result = operate(result, operators[i], numbers[i + 1]);
    }
    return result;
  }

  function syncBinaryFields() {
    // Keep these fields updated for the assignment requirements.
    state.firstOperand = state.nums.length ? state.nums[0] : null;
    state.operator = state.ops.length ? state.ops[state.ops.length - 1] : null;
    state.secondOperand = state.ops.length && !state.expectingNumber ? Number(state.currentInput) : null;
  }

  function appendDigit(digit) {
    if (state.error) resetAll();

    if (digit < "0" || digit > "9") return;

    if (state.expectingNumber) {
      state.currentInput = digit;
      state.expectingNumber = false;
    } else {
      if (state.currentInput === "0") state.currentInput = digit;
      else state.currentInput += digit;
    }

    syncBinaryFields();
    renderDisplay();
  }

  function appendDecimal() {
    if (state.error) resetAll();

    if (state.currentInput.includes(".")) return;

    if (state.expectingNumber) {
      state.currentInput = "0.";
      state.expectingNumber = false;
    } else if (state.currentInput === "0") {
      state.currentInput = "0.";
    } else {
      state.currentInput += ".";
    }

    syncBinaryFields();
    renderDisplay();
  }

  function backspace() {
    if (state.error) {
      resetAll();
      return;
    }

    if (state.expectingNumber) {
      // If we are waiting for the next number (e.g., user pressed "2 +"), remove the operator.
      if (state.ops.length === 0 || state.nums.length === 0) return;
      state.ops.pop();
      const lastNum = state.nums.pop();
      state.currentInput = String(lastNum);
      state.expectingNumber = false;
    } else if (state.currentInput.length <= 1) {
      state.currentInput = "0";
    } else {
      state.currentInput = state.currentInput.slice(0, -1);
      if (state.currentInput === "-" || state.currentInput === "") state.currentInput = "0";
    }

    syncBinaryFields();
    renderDisplay();
  }

  function setOperator(op) {
    if (state.error) return;
    const validOps = { "+": true, "-": true, "*": true, "/": true };
    if (!validOps[op]) return;

    // If an operator is pressed consecutively, just replace the last operator.
    if (state.ops.length && state.expectingNumber) {
      state.ops[state.ops.length - 1] = op;
      syncBinaryFields();
      renderDisplay();
      return;
    }

    // If this is the first operator, or we already have a complete number, push it.
    if (state.nums.length === state.ops.length) {
      state.nums.push(Number(state.currentInput));
    } else if (state.nums.length === state.ops.length + 1) {
      // Defensive: keep state aligned.
      state.nums = state.nums.slice(0, state.ops.length + 1);
    }

    state.ops.push(op);
    state.expectingNumber = true;
    state.currentInput = "0";

    syncBinaryFields();
    renderDisplay();
  }

  function evaluateEquals() {
    if (state.error) return;
    if (state.ops.length === 0) {
      renderDisplay();
      return;
    }

    // Reject incomplete expressions like "2 +" or "2 + *".
    if (state.expectingNumber) {
      setError("Syntax Error");
      return;
    }

    // Finalize the last typed number.
    if (state.nums.length === state.ops.length) {
      state.nums.push(Number(state.currentInput));
    }

    try {
      if (state.nums.length !== state.ops.length + 1) throwSyntaxError();
      for (const n of state.nums) {
        if (!Number.isFinite(n)) throwSyntaxError();
      }

      const result = evaluateExpression(state.nums, state.ops);
      const formatted = formatResult(result);
      if (formatted === "Error") throw new Error("Computation error");

      // Reset tokens but keep the result for further calculations.
      state.currentInput = formatted;
      state.nums = [];
      state.ops = [];
      state.expectingNumber = false;
      state.firstOperand = Number(formatted);
      state.operator = null;
      state.secondOperand = null;
      state.errorMessage = null;

      setDisplay(formatted);
    } catch (err) {
      if (err && err.message === "Syntax Error") setError("Syntax Error");
      else setError("Error");
    }
  }

  function handleButtonClick(btn) {
    const action = btn.dataset.action;
    const value = btn.dataset.value;

    if (action === "digit") {
      appendDigit(value);
      return;
    }
    if (action === "decimal") {
      appendDecimal();
      return;
    }
    if (action === "backspace") {
      backspace();
      return;
    }
    if (action === "clear") {
      resetAll();
      return;
    }
    if (action === "operator") {
      setOperator(value);
      return;
    }
    if (action === "equals") {
      evaluateEquals();
    }
  }

  function wireEvents() {
    for (const btn of keys) {
      btn.addEventListener("click", () => handleButtonClick(btn));
    }

    document.addEventListener("keydown", (e) => {
      // Don't intercept typing if there were inputs (none in this UI, but safe).
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

      const key = e.key;

      if (key >= "0" && key <= "9") {
        e.preventDefault();
        appendDigit(key);
        return;
      }
      if (key === ".") {
        e.preventDefault();
        appendDecimal();
        return;
      }
      if (key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (key === "Escape") {
        e.preventDefault();
        resetAll();
        return;
      }
      if (key === "+" || key === "-" || key === "*" || key === "/") {
        e.preventDefault();
        setOperator(key);
        return;
      }
      if (key === "=" || key === "Enter") {
        e.preventDefault();
        evaluateEquals();
      }
    });
  }

  function wireTheme() {
    if (!themeToggleEl) return;

    const saved = localStorage.getItem("calc-theme");
    if (saved === "dark") document.body.classList.add("dark");

    themeToggleEl.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark");
      localStorage.setItem("calc-theme", isDark ? "dark" : "light");
    });
  }

  function init() {
    wireTheme();
    wireEvents();
    syncBinaryFields();
    renderDisplay();
  }

  init();
})();

