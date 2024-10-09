const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  let marketplace;
  let owner;
  let seller;
  let buyer;
  let productPrice;
  const commission = 5;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy();
  });

  it("should allow a seller to create a product", async function () {
    const productName = "Test Product";
    productPrice = ethers.utils.parseEther("1");

    await marketplace.connect(seller).createProduct(productName, productPrice);

    const product = await marketplace.products(1);
    expect(product.name).to.equal(productName);
    expect(product.price).to.equal(productPrice);
    expect(product.seller).to.equal(seller.address);
  });

  it("should allow a buyer to purchase a product and distribute funds correctly", async function () {
    productPrice = ethers.utils.parseEther("1");

    // Seller creates a product
    await marketplace.connect(seller).createProduct("Test Product", productPrice);

    // Buyer purchases the product
    const ownerInitialBalance = await ethers.provider.getBalance(owner.address);
    const sellerInitialBalance = await ethers.provider.getBalance(seller.address);

    await marketplace.connect(buyer).purchaseProduct(1, { value: productPrice });

    const ownerFinalBalance = await ethers.provider.getBalance(owner.address);
    const sellerFinalBalance = await ethers.provider.getBalance(seller.address);

    // 5% commission to the owner
    const commissionAmount = productPrice.mul(commission).div(100);
    const sellerAmount = productPrice.sub(commissionAmount);

    expect(ownerFinalBalance.sub(ownerInitialBalance)).to.equal(commissionAmount);
    expect(sellerFinalBalance.sub(sellerInitialBalance)).to.equal(sellerAmount);
  });

  it("should emit events when a product is created and sold", async function () {
    const productName = "Test Product";
    productPrice = ethers.utils.parseEther("1");

    await expect(marketplace.connect(seller).createProduct(productName, productPrice))
      .to.emit(marketplace, "ProductCreated")
      .withArgs(1, seller.address, productName, productPrice, false);

    await expect(marketplace.connect(buyer).purchaseProduct(1, { value: productPrice }))
      .to.emit(marketplace, "ProductSold")
      .withArgs(1, seller.address, buyer.address, productPrice);
  });
});
