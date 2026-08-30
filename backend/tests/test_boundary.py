from app.api.tests import execute_boundary_tests

def test_boundary_verification_suite():
    """
    Executes the API boundary test suite under pytest to verify that all 30 tests pass.
    """
    results = execute_boundary_tests()
    assert results["failed"] == 0, f"Some boundary tests failed: {results['tests']}"
    assert results["passed"] == 30
    assert results["status"] == "PASS"
