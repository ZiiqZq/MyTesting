// database/handler.js
const { ipcMain } = require('electron');

function registerDatabaseHandlers(db) {
  console.log('🔧 Registering database handlers...');

  // ============================================
  // PRODUCT WITH SEQUENCE HANDLERS (NEW) - FIXED
  // ============================================

  ipcMain.handle('save-product-with-sequence', async (event, productData) => {
    console.log('💾 Handler: save-product-with-sequence called');
    const connection = await db.promise();
    
    try {
      await connection.beginTransaction();
      
      const { productName, seriesNumber, seriesName, testSequence, testParameters } = productData;
      
      // 1. Check if product exists
      const [existing] = await connection.query(
        'SELECT id FROM products WHERE product_name = ? AND series_number = ?',
        [productName, seriesNumber]
      );
      
      if (existing.length > 0) {
        await connection.rollback();
        return { 
          success: false, 
          error: 'Product with this name and series number already exists!' 
        };
      }
      
      // 2. Insert product - TANPA product_code
      const [productResult] = await connection.query(
        `INSERT INTO products (product_name, series_number, series, is_active, created_at)
         VALUES (?, ?, ?, 1, NOW())`,
        [productName, seriesNumber, seriesName || null]
      );
      
      const productId = productResult.insertId;
      console.log('✅ Product created with ID:', productId);
      
      // 3. Insert test sequence
      if (testSequence && testSequence.length > 0) {
        for (const test of testSequence) {
          await connection.query(
            `INSERT INTO product_test_sequence (product_id, test_type_id, sequence_order, is_required)
             VALUES (?, ?, ?, 1)`,
            [productId, test.testTypeId, test.sequenceOrder]
          );
        }
        console.log(`✅ Test sequence added: ${testSequence.length} tests`);
      }
      
      // 4. Insert test parameters
      if (testParameters && Object.keys(testParameters).length > 0) {
        for (const [testTypeId, params] of Object.entries(testParameters)) {
          for (const param of params) {
            await connection.query(
              `INSERT INTO product_test_parameters 
               (product_id, test_type_id, parameter_name, parameter_value, parameter_unit, 
                lsl, usl, validation_type, display_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                productId,
                testTypeId,
                param.name,
                param.value || null,
                param.unit || null,
                param.lsl || null,
                param.usl || null,
                param.validationType || 'lsl_usl',
                param.displayOrder || 0
              ]
            );
          }
        }
        console.log('✅ Test parameters added');
      }
      
      await connection.commit();
      
      return { 
        success: true, 
        productId: productId,
        message: 'Product with test sequence saved successfully!' 
      };
      
    } catch (err) {
      await connection.rollback();
      console.error('❌ Error saving product with sequence:', err);
      return { success: false, error: err.message };
    }
  });

  // Get products with their test sequences
  ipcMain.handle('get-products-with-sequence', async () => {
    console.log('📦 Handler: get-products-with-sequence called');
    try {
      const [products] = await db.promise().query(
        `SELECT p.*, 
         GROUP_CONCAT(
           CONCAT(tt.name, ':', pts.sequence_order, ':', pts.test_type_id)
           ORDER BY pts.sequence_order 
           SEPARATOR '|'
         ) as test_sequence
         FROM products p
         LEFT JOIN product_test_sequence pts ON p.id = pts.product_id
         LEFT JOIN test_types tt ON pts.test_type_id = tt.id
         WHERE p.is_active = 1
         GROUP BY p.id
         ORDER BY p.series_number, p.product_name`
      );
      
      // Parse test_sequence
      const productsWithSequence = products.map(p => ({
        ...p,
        testSequence: p.test_sequence ? p.test_sequence.split('|').map(seq => {
          const [name, order, id] = seq.split(':');
          return { testTypeName: name, sequenceOrder: parseInt(order), testTypeId: parseInt(id) };
        }) : []
      }));
      
      console.log(`📦 Found ${productsWithSequence.length} products with sequences`);
      return { success: true, data: productsWithSequence };
    } catch (err) {
      console.error('❌ Error in get-products-with-sequence:', err);
      return { success: false, error: err.message };
    }
  });

  // Get test parameters for a product and test type
  ipcMain.handle('get-test-parameters', async (event, { productId, testTypeId }) => {
    console.log(`📋 Handler: get-test-parameters for product ${productId}, test ${testTypeId}`);
    try {
      const [params] = await db.promise().query(
        `SELECT * FROM product_test_parameters
         WHERE product_id = ? AND test_type_id = ?
         ORDER BY display_order`,
        [productId, testTypeId]
      );
      
      console.log(`📋 Found ${params.length} parameters`);
      return { success: true, data: params };
    } catch (err) {
      console.error('❌ Error getting test parameters:', err);
      return { success: false, error: err.message };
    }
  });

  // Get available test types for a product (based on sequence)
  ipcMain.handle('get-product-test-types', async (event, productId) => {
    console.log(`🧪 Handler: get-product-test-types for product ${productId}`);
    try {
      const [testTypes] = await db.promise().query(
        `SELECT tt.id, tt.name, pts.sequence_order, pts.is_required
         FROM product_test_sequence pts
         JOIN test_types tt ON pts.test_type_id = tt.id
         WHERE pts.product_id = ?
         ORDER BY pts.sequence_order`,
        [productId]
      );
      
      console.log(`🧪 Found ${testTypes.length} test types for product`);
      return { success: true, data: testTypes };
    } catch (err) {
      console.error('❌ Error getting product test types:', err);
      return { success: false, error: err.message };
    }
  });

  // Get products grouped by series (for dropdown in Generate page)
  ipcMain.handle('get-products-by-series', async () => {
    console.log('📦 Handler: get-products-by-series called');
    try {
      const [products] = await db.promise().query(
        `SELECT id, product_name, series_number, series
         FROM products
         WHERE is_active = 1
         ORDER BY series_number, product_name`
      );
      
      // Group by series_number
      const groupedBySeries = {};
      products.forEach(p => {
        const key = p.series_number || 'Other';
        if (!groupedBySeries[key]) {
          groupedBySeries[key] = [];
        }
        groupedBySeries[key].push(p);
      });
      
      console.log(`📦 Products grouped into ${Object.keys(groupedBySeries).length} series`);
      return { success: true, data: groupedBySeries };
    } catch (err) {
      console.error('❌ Error in get-products-by-series:', err);
      return { success: false, error: err.message };
    }
  });

  // ============================================
  // PRODUCTS HANDLERS - TANPA product_code
  // ============================================
  ipcMain.handle('get-products', async () => {
    console.log('📦 Handler: get-products called');
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM products WHERE is_active = 1 ORDER BY product_name'
      );
      console.log(`📦 Found ${rows.length} products`);
      return { success: true, data: rows };
    } catch (err) {
      console.error('❌ Error in get-products:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('save-product', async (event, productData) => {
    console.log('💾 Handler: save-product called with:', productData);
    try {
      const { productName, series } = productData;
      
      const [existing] = await db.promise().query(
        'SELECT id FROM products WHERE product_name = ?',
        [productName]
      );
      
      if (existing.length > 0) {
        return { 
          success: false, 
          error: 'Produk dengan nama ini sudah ada!' 
        };
      }
      
      const [result] = await db.promise().query(
        `INSERT INTO products (product_name, series, created_at)
         VALUES (?, ?, NOW())`,
        [productName, series || null]
      );
      
      console.log('✅ Product saved with ID:', result.insertId);
      return { 
        success: true, 
        id: result.insertId,
        message: 'Produk berhasil ditambahkan!' 
      };
      
    } catch (err) {
      console.error('❌ Error save product:', err);
      return { success: false, error: err.message };
    }
  });

  // ============================================
  // TEST TYPES HANDLERS
  // ============================================
  ipcMain.handle('get-test-types', async () => {
    console.log('🧪 Handler: get-test-types called');
    try {
      const [rows] = await db.promise().query(
        'SELECT * FROM test_types ORDER BY sequence_order'
      );
      console.log(`🧪 Found ${rows.length} test types`);
      return { success: true, data: rows };
    } catch (err) {
      console.error('❌ Error in get-test-types:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('add-custom-test-type', async (event, testTypeName) => {
    console.log('➕ Handler: add-custom-test-type called with:', testTypeName);
    try {
      const [existing] = await db.promise().query(
        'SELECT id FROM test_types WHERE name = ?',
        [testTypeName]
      );

      if (existing.length > 0) {
        console.log('❌ Test type already exists:', testTypeName);
        return { success: false, error: 'Test type dengan nama yang sama sudah ada' };
      }

      const [maxOrder] = await db.promise().query(
        'SELECT MAX(sequence_order) as max_order FROM test_types'
      );
      const nextOrder = (maxOrder[0].max_order || 0) + 1;

      const [result] = await db.promise().query(
        'INSERT INTO test_types (name, is_custom, sequence_order) VALUES (?, TRUE, ?)',
        [testTypeName, nextOrder]
      );

      console.log('✅ Custom test type added with ID:', result.insertId);
      return { 
        success: true, 
        id: result.insertId, 
        message: 'Test type custom berhasil ditambahkan!' 
      };

    } catch (err) {
      console.error('❌ Error adding custom test type:', err);
      return { success: false, error: err.message };
    }
  });

  // ============================================
  // TEMPLATES HANDLERS
  // ============================================
  ipcMain.handle('save-template', async (event, templateData) => {
    console.log('💾 Handler: save-template called');
    try {
      const { productId, testTypeId, templateName, columns } = templateData;

      console.log('📝 Saving template:', {
        productId,
        testTypeId,
        templateName,
        columnsCount: columns.length
      });

      if (!productId || !testTypeId || !templateName || !columns) {
        return { success: false, error: 'Data template tidak lengkap' };
      }

      if (columns.length === 0) {
        return { success: false, error: 'Template harus memiliki minimal 1 kolom' };
      }

      const [existing] = await db.promise().query(
        'SELECT id FROM templates WHERE product_id = ? AND test_type_id = ?',
        [productId, testTypeId]
      );

      if (existing.length > 0) {
        return { 
          success: false, 
          error: `A template for this product and test type already exists. Please use a different name or edit the existing one.` 
        };
      }

      const [result] = await db.promise().query(
        `INSERT INTO templates (product_id, test_type_id, template_name, custom_columns, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          productId, 
          testTypeId, 
          templateName, 
          JSON.stringify({ columns }),
          null
        ]
      );

      const templateId = result.insertId;
      console.log('✅ Template saved with ID:', templateId);

      return { 
        success: true, 
        id: templateId, 
        message: 'Template berhasil disimpan!' 
      };

    } catch (err) {
      console.error('❌ Error saving template:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get-templates-by-product', async (event, productId) => {
    console.log(`📋 Handler: get-templates-by-product called for product ${productId}`);
    try {
      const [rows] = await db.promise().query(
        `SELECT t.*, tt.name as test_type_name, tt.sequence_order
         FROM templates t
         JOIN test_types tt ON t.test_type_id = tt.id
         WHERE t.product_id = ? AND t.is_active = 1
         ORDER BY tt.sequence_order`,
        [productId]
      );

      const templates = rows.map(row => ({
        ...row,
        custom_columns: typeof row.custom_columns === 'string' 
          ? JSON.parse(row.custom_columns) 
          : row.custom_columns
      }));

      console.log(`📋 Found ${templates.length} templates for product ${productId}`);
      return { success: true, data: templates };
    } catch (err) {
      console.error('❌ Error in get-templates-by-product:', err);
      return { success: false, error: err.message };
    }
  });

  // ============================================
  // DATA ENTRY HANDLERS
  // ============================================
  ipcMain.handle('get-completed-tests-by-product', async (event, productId) => {
    console.log(`✅ Handler: get-completed-tests-by-product called for product ${productId}`);
    try {
      const [rows] = await db.promise().query(
        `SELECT DISTINCT test_type_id, status
         FROM test_entries
         WHERE product_id = ? AND status = 'Pass'`,
        [productId]
      );

      console.log(`✅ Found ${rows.length} completed tests for product ${productId}`);
      return { success: true, data: rows };
    } catch (err) {
      console.error('❌ Error in get-completed-tests-by-product:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('check-previous-test', async (event, { productId, serialNumber, testTypeId }) => {
    console.log(`🔍 Checking previous test for SN: ${serialNumber}, Test Type: ${testTypeId}`);
    try {
      const [testType] = await db.promise().query(
        'SELECT sequence_order FROM test_types WHERE id = ?',
        [testTypeId]
      );

      if (testType.length === 0) {
        return { success: false, error: 'Test type not found' };
      }

      const currentSequence = testType[0].sequence_order;

      if (currentSequence === 1) {
        return { success: true, canProceed: true };
      }

      const [prevTestType] = await db.promise().query(
        'SELECT id FROM test_types WHERE sequence_order = ?',
        [currentSequence - 1]
      );

      if (prevTestType.length === 0) {
        return { success: true, canProceed: true };
      }

      const [prevTest] = await db.promise().query(
        `SELECT status, can_proceed_to_next 
         FROM test_entries 
         WHERE product_id = ? 
         AND original_serial_number = ? 
         AND test_type_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [productId, serialNumber, prevTestType[0].id]
      );

      if (prevTest.length === 0) {
        return { 
          success: true, 
          canProceed: false, 
          message: 'Previous test not found for this serial number' 
        };
      }

      const canProceed = prevTest[0].status === 'Pass' && prevTest[0].can_proceed_to_next === 1;

      return { success: true, canProceed, previousStatus: prevTest[0].status };
    } catch (err) {
      console.error('❌ Error checking previous test:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('submit-test-entries', async (event, submitData) => {
    console.log('💾 Handler: submit-test-entries called');
    console.log('📦 Data:', {
      templateId: submitData.templateId,
      productId: submitData.productId,
      testTypeId: submitData.testTypeId,
      entriesCount: submitData.entries.length
    });

    const connection = await db.promise();

    try {
      await connection.beginTransaction();

      // Get or create operator
      const operatorId = await getOrCreateOperator(connection, submitData.operatorName);

      // Get test type sequence
      const [testType] = await connection.query(
        'SELECT sequence_order FROM test_types WHERE id = ?',
        [submitData.testTypeId]
      );
      const isFirstTest = testType[0].sequence_order === 1;

      const insertedIds = [];
      for (const entry of submitData.entries) {
        if (!isFirstTest) {
          const [prevTestType] = await connection.query(
            'SELECT id FROM test_types WHERE sequence_order = ?',
            [testType[0].sequence_order - 1]
          );

          if (prevTestType.length > 0) {
            const [prevTest] = await connection.query(
              `SELECT status FROM test_entries 
               WHERE product_id = ? AND original_serial_number = ? AND test_type_id = ?
               ORDER BY created_at DESC LIMIT 1`,
              [submitData.productId, entry.serialNumber, prevTestType[0].id]
            );

            if (prevTest.length === 0 || prevTest[0].status !== 'Pass') {
              await connection.rollback();
              return { 
                success: false, 
                error: `Serial ${entry.serialNumber}: Previous test not completed or failed` 
              };
            }
          }
        }

        const canProceedToNext = entry.status === 'Pass' ? 1 : 0;

        const [result] = await connection.query(
          `INSERT INTO test_entries (
            template_id, product_id, test_type_id, operator_id,
            test_date, po_number, original_serial_number, display_serial_number,
            is_retest, retest_iteration, test_results, status,
            can_proceed_to_next, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            submitData.templateId,
            submitData.productId,
            submitData.testTypeId,
            operatorId,
            submitData.testDate,
            submitData.poNumber,
            entry.serialNumber,
            entry.displaySerialNumber,
            0,
            0,
            JSON.stringify(entry.testResults),
            entry.status,
            canProceedToNext
          ]
        );

        insertedIds.push(result.insertId);
      }

      await connection.commit();

      console.log(`✅ Successfully inserted ${insertedIds.length} test entries`);
      return { 
        success: true, 
        insertedCount: insertedIds.length,
        message: `Successfully saved ${insertedIds.length} test entries`
      };

    } catch (err) {
      await connection.rollback();
      console.error('❌ Error submitting test entries:', err);
      return { success: false, error: err.message };
    }
  });

  // Helper function
  async function getOrCreateOperator(connection, operatorName) {
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR full_name = ?',
      [operatorName, operatorName]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    const [result] = await connection.query(
      `INSERT INTO users (username, password, full_name, role, is_active) 
       VALUES (?, 'temp123', ?, 'operator', 1)`,
      [operatorName, operatorName]
    );

    return result.insertId;
  }

  // ============================================
  // RETEST HANDLERS (FOR ADMIN)
  // ============================================
  ipcMain.handle('create-retest-entry', async (event, { testEntryId, adminId }) => {
    console.log(`🔄 Creating retest for entry ${testEntryId}`);
    try {
      const connection = await db.promise();

      const [original] = await connection.query(
        'SELECT * FROM test_entries WHERE id = ?',
        [testEntryId]
      );

      if (original.length === 0) {
        return { success: false, error: 'Original test entry not found' };
      }

      const orig = original[0];

      const [maxRetest] = await connection.query(
        `SELECT MAX(retest_iteration) as max_iter 
         FROM test_entries 
         WHERE original_serial_number = ? AND test_type_id = ?`,
        [orig.original_serial_number, orig.test_type_id]
      );

      const nextIteration = (maxRetest[0].max_iter || 0) + 1;
      const displaySN = `${orig.original_serial_number}_RT${nextIteration}`;

      const [result] = await connection.query(
        `INSERT INTO test_entries (
          template_id, product_id, test_type_id, operator_id,
          test_date, po_number, original_serial_number, display_serial_number,
          is_retest, retest_iteration, test_results, status,
          previous_test_id, can_proceed_to_next, created_at
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 1, ?, '{}', 'Fail', ?, 0, NOW())`,
        [
          orig.template_id,
          orig.product_id,
          orig.test_type_id,
          adminId,
          orig.po_number,
          orig.original_serial_number,
          displaySN,
          nextIteration,
          testEntryId
        ]
      );

      console.log(`✅ Retest entry created with ID: ${result.insertId}`);
      return { 
        success: true, 
        retestId: result.insertId, 
        displaySerialNumber: displaySN 
      };

    } catch (err) {
      console.error('❌ Error creating retest:', err);
      return { success: false, error: err.message };
    }
  });

  // ============================================
  // TESTING PAGE HANDLER
  // ============================================
  ipcMain.on('Testing', (event, data) => {
    console.log('Navigation to Testing:', data);
    const { BrowserWindow } = require('electron');
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.loadFile('Page/Testing.html')
        .then(() => {
          console.log('✅ Testing page loaded successfully');
        })
        .catch((err) => {
          console.error('❌ Error loading Testing page:', err);
        });
    }
  });

  console.log('✅ All database handlers registered successfully');
}

module.exports = { registerDatabaseHandlers };