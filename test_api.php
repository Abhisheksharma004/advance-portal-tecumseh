<?php
// Test add employee API endpoint
$url = 'http://localhost/advance-portal-main/api.php?action=add_employee';

$postData = http_build_query([
    'id' => 'EMP001',
    'name' => 'Test Employee'
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => $postData
    ]
]);

echo "Testing API endpoint: $url\n";
echo "POST data: $postData\n\n";

$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Failed to get response from API\n";
} else {
    echo "API Response:\n";
    echo $response . "\n";
}
?>
