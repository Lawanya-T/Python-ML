from flask import Flask, render_template, request, redirect, url_for
import csv
import os
import calendar
import datetime

app = Flask(__name__)

EXPENSE_FILE = "expenses.csv"
BUDGET = 2000


class Expense:
    def __init__(self, name, amount, category):
        self.name = name
        self.amount = float(amount)
        self.category = category


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Get form data
        name = request.form["name"]
        amount = request.form["amount"]
        category = request.form["category"]

        # Save expense
        with open(EXPENSE_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([name, amount, category])

        return redirect(url_for("index"))

    # Load expenses
    expenses = []
    if os.path.exists(EXPENSE_FILE):
        with open(EXPENSE_FILE, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                expenses.append(Expense(row[0], row[1], row[2]))

    # Calculate summary
    total_spent = sum(e.amount for e in expenses)
    remaining_budget = BUDGET - total_spent
    now = datetime.datetime.now()
    days_in_month = calendar.monthrange(now.year, now.month)[1]
    remaining_days = days_in_month - now.day
    daily_budget = remaining_budget / remaining_days if remaining_days > 0 else 0

    return render_template(
        "index.html",
        expenses=expenses,
        total_spent=total_spent,
        remaining_budget=remaining_budget,
        daily_budget=daily_budget,
        budget=BUDGET,
    )


if __name__ == "__main__":
    app.run(debug=True)
