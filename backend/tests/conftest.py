import os
import sys

# Ensure the backend root (where main.py and its sibling packages live) is
# importable regardless of which directory pytest is invoked from.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
