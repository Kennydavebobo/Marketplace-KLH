// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Marketplace {
    address public owner;
    uint256 public productCount = 0;
    uint256 public constant COMMISSION_PERCENTAGE = 5;

    struct Product {
        uint256 id;
        address payable seller;
        string name;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => Product) public products;

    event ProductCreated(
        uint256 id,
        address seller,
        string name,
        uint256 price,
        bool sold
    );

    event ProductSold(
        uint256 id,
        address seller,
        address buyer,
        uint256 price
    );

    constructor() {
        owner = msg.sender;
    }

    // Function to create a product
    function createProduct(string memory _name, uint256 _price) public {
        require(_price > 0, "Price must be greater than zero");

        productCount++;
        products[productCount] = Product(
            productCount,
            payable(msg.sender),
            _name,
            _price,
            false
        );

        emit ProductCreated(productCount, msg.sender, _name, _price, false);
    }

    // Function to purchase a product
    function purchaseProduct(uint256 _id) public payable {
        Product memory product = products[_id];
        require(product.id > 0 && product.id <= productCount, "Invalid product");
        require(msg.value == product.price, "Please submit the asking price");
        require(!product.sold, "Product already sold");

        // Calculate commission
        uint256 commission = (product.price * COMMISSION_PERCENTAGE) / 100;
        uint256 sellerAmount = product.price - commission;

        // Pay owner and seller
        payable(owner).transfer(commission);
        product.seller.transfer(sellerAmount);

        // Mark product as sold
        product.sold = true;
        products[_id] = product;

        emit ProductSold(_id, product.seller, msg.sender, product.price);
    }
}
