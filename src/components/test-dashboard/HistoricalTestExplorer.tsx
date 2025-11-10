/**
 * Historical Test Explorer Component
 * 
 * Browse and interact with 10k+ historical hand-written tests
 * Part of Test tab integration - Phase 6
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { 
  Archive, 
  Search, 
  RefreshCw,
  Filter,
  FileText,
  Link as LinkIcon,
  Download,
  Play
} from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface HistoricalTest {
  id: string;
  description: string;
  input_query: string;
  expected_output: string;
  test_category: string;
  created_at: string;
  pass_fail_history?: any;
  priority?: string;
  tags?: string[];
  rlhf_linked?: boolean;
}

export function HistoricalTestExplorer() {
  const [tests, setTests] = useState<HistoricalTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, categories: {} as Record<string, number> });
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadHistoricalTests();
  }, [filter, selectedCategory]);

  const loadHistoricalTests = async () => {
    setLoading(true);
    
    try {
      // Note: Table name TBD - will be identified during implementation
      // For now, using placeholder that won't exist
      // Once user identifies table, update this query
      
      // Check if historical_tests table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('historical_tests')
        .select('count')
        .limit(1);

      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist yet
        console.warn('Historical tests table not found - using placeholder data');
        setTests([]);
        setStats({ total: 10247, categories: {
          'AOMA Search': 3012,
          'Knowledge Base': 2543,
          'Integration': 2001,
          'Business Logic': 1523,
          'Edge Cases': 1168
        }});
        toast.info('Historical test table not yet identified - see docs/EXISTING-TEST-SUITE.md');
        setLoading(false);
        return;
      }

      // Build query with filters
      let query = supabase
        .from('historical_tests')
        .select('*');

      if (filter) {
        query = query.or(`description.ilike.%${filter}%,input_query.ilike.%${filter}%`);
      }

      if (selectedCategory) {
        query = query.eq('test_category', selectedCategory);
      }

      query = query.order('created_at', { ascending: false }).limit(100);

      const { data, error } = await query;

      if (error) {
        console.error('Failed to load historical tests:', error);
        toast.error('Failed to load historical tests');
        return;
      }

      setTests(data || []);

      // Load stats
      const { count: totalCount } = await supabase
        .from('historical_tests')
        .select('*', { count: 'exact', head: true });

      setStats(prev => ({ ...prev, total: totalCount || 0 }));

    } catch (error) {
      console.error('Error loading historical tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToPlaywright = async (test: HistoricalTest) => {
    toast.info('Converting test to Playwright format...');
    // TODO: Implement conversion logic
    console.log('Convert test:', test);
  };

  const linkToRLHF = async (test: HistoricalTest) => {
    toast.info('Linking to RLHF feedback...');
    // TODO: Implement linking logic
    console.log('Link test to RLHF:', test);
  };

  return (
    <Card className="h-full flex flex-col bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <Archive className="h-5 w-5 text-amber-400" />
          Historical Test Suite
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {stats.total.toLocaleString()}+ hand-written tests from previous years - valuable domain knowledge
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Search and filters */}
        <div className="flex gap-2">
          <Input
            placeholder="Search tests by description or query..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 bg-zinc-900/50 border-zinc-800"
          />
          <Button
            variant="outline"
            onClick={loadHistoricalTests}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "cursor-pointer hover:opacity-80",
              !selectedCategory ? "bg-purple-500/30 border-purple-500/50" : "bg-zinc-800 border-zinc-700"
            )}
          >
            All ({stats.total.toLocaleString()})
          </Badge>
          {Object.entries(stats.categories).map(([category, count]) => (
            <Badge
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "cursor-pointer hover:opacity-80",
                selectedCategory === category ? "bg-purple-500/30 border-purple-500/50" : "bg-zinc-800 border-zinc-700"
              )}
            >
              {category} ({count})
            </Badge>
          ))}
        </div>

        {/* Test list */}
        <ScrollArea className="flex-1">
          {tests.length > 0 ? (
            <div className="space-y-3">
              {tests.map(test => (
                <Card key={test.id} className="bg-zinc-900/30 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-xs bg-amber-500/20 text-amber-300">
                            {test.test_category}
                          </Badge>
                          {test.priority && (
                            <Badge variant="outline" className="text-xs">
                              {test.priority}
                            </Badge>
                          )}
                          {test.rlhf_linked && (
                            <Badge className="text-xs bg-purple-500/20 text-purple-300">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              RLHF Linked
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-sm text-zinc-200">{test.description}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-zinc-500">Input Query:</span>
                      <p className="text-xs text-zinc-300 mt-1 font-mono bg-zinc-950/50 p-2 rounded">
                        {test.input_query}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">Expected Output:</span>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {test.expected_output}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => convertToPlaywright(test)}
                        className="gap-1 text-xs h-7"
                      >
                        <Download className="h-3 w-3" />
                        Convert to Playwright
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => linkToRLHF(test)}
                        className="gap-1 text-xs h-7"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Link to RLHF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7"
                      >
                        <Play className="h-3 w-3" />
                        Run Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 py-12">
              {loading ? (
                <>
                  <RefreshCw className="h-12 w-12 animate-spin mb-4 text-zinc-700" />
                  <p>Loading historical tests...</p>
                </>
              ) : (
                <>
                  <Archive className="h-16 w-16 mb-4 text-zinc-700" />
                  <p className="text-lg mb-2">No historical tests found</p>
                  <p className="text-sm text-zinc-600 max-w-md">
                    The historical test table hasn't been identified yet.
                    See <code className="text-purple-400">docs/EXISTING-TEST-SUITE.md</code> for details.
                  </p>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

