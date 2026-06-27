def test_app_imports():
    """Importing main should never raise. This catches syntax errors and
    broken module-level service initialization before they reach production."""
    import main

    assert main.app is not None
