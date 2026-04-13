#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
using namespace std;

double calculate(double a, double b, char op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b != 0 ? a / b : 0;
        default:  return b;
    }
}

string formatResult(double value) {
    ostringstream oss;
    oss << setprecision(10) << noshowpoint << value;
    return oss.str();
}

void printHistory(const vector<string>& history) {
    if (history.empty()) return;
    cout << "\n--- History (last 5) ---\n";
    for (const auto& entry : history) {
        cout << "  " << entry << "\n";
    }
    cout << "------------------------\n";
}

int main() {
    double previousValue = 0;
    double current = 0;
    char op = 0;
    bool hasOperator = false;
    vector<string> history;

    cout << "Calculator — operators: + - * /  |  % = percent  |  c = clear  |  q = quit\n\n";

    while (true) {
        printHistory(history);

        if (hasOperator)
            cout << previousValue << " " << op << " ";

        cout << "Enter number: ";
        string input;
        cin >> input;

        if (input == "q") break;

        if (input == "c") {
            previousValue = 0;
            current = 0;
            op = 0;
            hasOperator = false;
            cout << "Cleared.\n\n";
            continue;
        }

        if (input == "%") {
            current = current / 100;
            cout << "Result: " << formatResult(current) << "\n\n";
            continue;
        }

        current = stod(input);

        cout << "Enter operator (+ - * /) or = to evaluate: ";
        string opInput;
        cin >> opInput;

        if (opInput == "=") {
            if (hasOperator) {
                double result = calculate(previousValue, current, op);
                string entry = formatResult(previousValue) + " " + op + " " + formatResult(current) + " = " + formatResult(result);
                history.insert(history.begin(), entry);
                if (history.size() > 5) history.pop_back();
                cout << "Result: " << formatResult(result) << "\n\n";
                previousValue = 0;
                hasOperator = false;
                op = 0;
            } else {
                cout << "Result: " << formatResult(current) << "\n\n";
            }
            continue;
        }

        if (hasOperator) {
            double result = calculate(previousValue, current, op);
            string entry = formatResult(previousValue) + " " + op + " " + formatResult(current) + " = " + formatResult(result);
            history.insert(history.begin(), entry);
            if (history.size() > 5) history.pop_back();
            previousValue = result;
        } else {
            previousValue = current;
        }

        op = opInput[0];
        hasOperator = true;
    }

    cout << "Goodbye.\n";
    return 0;
}
